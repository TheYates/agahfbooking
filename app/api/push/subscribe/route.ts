import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// In production, store subscriptions in your database
// This is a simple in-memory store for demonstration
const subscriptions = new Map<string, PushSubscription>();

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
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

    // Store subscription with user ID
    // In production, save to database:
    // await db.pushSubscription.upsert({
    //   where: { userId: session.user.id },
    //   create: { userId: session.user.id, subscription: JSON.stringify(subscription) },
    //   update: { subscription: JSON.stringify(subscription) }
    // });

    subscriptions.set(session.user.id, subscription);

    console.log(`Push subscription saved for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: "Subscription saved",
    });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}
