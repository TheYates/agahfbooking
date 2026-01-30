import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function extractKeys(subscription: any) {
  const p256dh = subscription?.keys?.p256dh || null;
  const authKey = subscription?.keys?.auth || null;
  return { p256dh, auth: authKey };
}

export async function POST(request: Request) {
  try {
    const h = await headers();
    const session = await auth.api.getSession({
      headers: h,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription" },
        { status: 400 }
      );
    }

    const { p256dh, auth: authKey } = extractKeys(subscription);

    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: session.user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth: authKey,
          subscription,
          user_agent: h.get("user-agent"),
        } as any,
        { onConflict: "endpoint" }
      );

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Subscription saved",
    });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
