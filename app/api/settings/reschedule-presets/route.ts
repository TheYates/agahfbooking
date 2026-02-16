import { NextRequest, NextResponse } from "next/server";
import { getAllPresets, createPreset } from "@/lib/reschedule-presets-service";
import { withAuth } from "@/lib/api-auth";

export const GET = withAuth(
  async () => {
    try {
      const presets = await getAllPresets(false);
      return NextResponse.json({ presets });
    } catch (error) {
      console.error("Error fetching presets:", error);
      return NextResponse.json(
        { error: "Failed to fetch presets" },
        { status: 500 }
      );
    }
  },
  { requireStaff: true }
);

export const POST = withAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { message } = body;

      if (!message || typeof message !== "string" || !message.trim()) {
        return NextResponse.json(
          { error: "Message is required" },
          { status: 400 }
        );
      }

      const preset = await createPreset({ message: message.trim() });
      return NextResponse.json({ preset });
    } catch (error) {
      console.error("Error creating preset:", error);
      return NextResponse.json(
        { error: "Failed to create preset" },
        { status: 500 }
      );
    }
  },
  { requireStaff: true }
);
