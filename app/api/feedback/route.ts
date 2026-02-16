import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feedbackType, message } = body;

    if (!feedbackType || !message || !message.trim()) {
      return NextResponse.json(
        { error: "Feedback type and message are required" },
        { status: 400 }
      );
    }

// Get user info from session (optional - guests can also submit)
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    
    let userId = null;
    let userType = "guest";
    let userName = null;
    let userContact = null;

    if (sessionId) {
      const session = await getSession(sessionId);
      if (session) {
        userId = session.userId;
        userType = session.role || "client";
        userName = session.name;
        userContact = session.phone;
      }
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("app_feedback")
      .insert({
        user_id: userId,
        user_type: userType,
        user_name: userName,
        user_contact: userContact,
        feedback_type: feedbackType,
        message: message.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully! Thank you for helping us improve.",
      data,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
