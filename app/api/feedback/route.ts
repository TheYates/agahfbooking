import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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
    const sessionToken = cookieStore.get("session_token");
    
    let userId = null;
    let userType = "guest";
    let userName = null;
    let userContact = null;

    if (sessionToken) {
      try {
        const userData = JSON.parse(sessionToken.value);
        userId = userData.id;
        userType = userData.role || "client";
        userName = userData.name || userData.username;
        userContact = userData.phone || userData.email;
      } catch (error) {
        console.error("Failed to parse session token:", error);
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
