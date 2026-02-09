import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000);

  const { data: reminders, error } = await supabase
    .from("push_reminders")
    .select("id, appointment_id, user_id, title, body, scheduled_time")
    .eq("status", "scheduled")
    .lte("scheduled_time", windowEnd.toISOString());

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
    });
  }

  for (const reminder of reminders ?? []) {
    const { error: updateError } = await supabase
      .from("push_reminders")
      .update({ status: "processing" })
      .eq("id", reminder.id);

    if (updateError) continue;

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("subscription, endpoint")
      .eq("user_id", reminder.user_id);

    if (subError || !subscriptions?.length) {
      await supabase
        .from("push_reminders")
        .update({ status: "failed" })
        .eq("id", reminder.id);
      continue;
    }

    const payload = {
      title: reminder.title,
      body: reminder.body,
      icon: "/icons/icon-192x192.png",
      tag: "appointment-reminder",
      data: { type: "appointment_reminder", appointmentId: reminder.appointment_id },
    };

    const { data: pushData, error: pushError } = await supabase.functions.invoke(
      "send-push",
      {
        body: {
          subscriptions,
          payload,
        },
      }
    );

    if (pushError || (pushData && !pushData.success)) {
      await supabase
        .from("push_reminders")
        .update({ status: "failed" })
        .eq("id", reminder.id);
      continue;
    }

    await supabase
      .from("push_reminders")
      .update({ status: "sent" })
      .eq("id", reminder.id);
  }

  return new Response(JSON.stringify({ success: true, processed: reminders?.length || 0 }));
});
