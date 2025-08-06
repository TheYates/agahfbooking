import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/db-services";
import { requireAdminAuth } from "@/lib/auth-server";

// POST /api/users/[id]/toggle-active - Toggle user active status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAdminAuth();
    
    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const updatedUser = await UserService.toggleActive(userId);

    return NextResponse.json({ 
      user: updatedUser,
      message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error("Toggle user active error:", error);
    return NextResponse.json(
      { error: "Failed to toggle user status" },
      { status: 500 }
    );
  }
}
