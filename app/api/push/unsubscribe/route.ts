import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", session.user.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Subscription removed",
    });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
