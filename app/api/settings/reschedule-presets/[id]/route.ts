import { NextRequest, NextResponse } from "next/server";
import { updatePreset, deletePreset } from "@/lib/reschedule-presets-service";
import { withAuth } from "@/lib/api-auth";

export const PATCH = withAuth(
  async (request: NextRequest) => {
    try {
      const url = new URL(request.url);
      const idStr = url.pathname.split("/").filter(Boolean).pop();
      const id = parseInt(idStr || "");
      
      if (isNaN(id)) {
        return NextResponse.json({ error: "Invalid preset ID" }, { status: 400 });
      }

      const body = await request.json();
      const { message, is_active } = body;

      if (message === undefined && is_active === undefined) {
        return NextResponse.json(
          { error: "No update fields provided" },
          { status: 400 }
        );
      }

      const updateData: { message?: string; is_active?: boolean } = {};
      if (message !== undefined) {
        if (typeof message !== "string" || !message.trim()) {
          return NextResponse.json(
            { error: "Message must be a non-empty string" },
            { status: 400 }
          );
        }
        updateData.message = message.trim();
      }
      if (is_active !== undefined) {
        updateData.is_active = Boolean(is_active);
      }

      const preset = await updatePreset(id, updateData);
      return NextResponse.json({ preset });
    } catch (error) {
      console.error("Error updating preset:", error);
      return NextResponse.json(
        { error: "Failed to update preset" },
        { status: 500 }
      );
    }
  },
  { requireStaff: true }
);

export const DELETE = withAuth(
  async (request: NextRequest) => {
    try {
      const url = new URL(request.url);
      const idStr = url.pathname.split("/").filter(Boolean).pop();
      const id = parseInt(idStr || "");
      
      if (isNaN(id)) {
        return NextResponse.json({ error: "Invalid preset ID" }, { status: 400 });
      }

      await deletePreset(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting preset:", error);
      return NextResponse.json(
        { error: "Failed to delete preset" },
        { status: 500 }
      );
    }
  },
  { requireStaff: true }
);
