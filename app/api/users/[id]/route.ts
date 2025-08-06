import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/db-services";
import { requireAdminAuth } from "@/lib/auth-server";
import bcrypt from "bcryptjs";

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await UserService.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const updateData = await request.json();
    const { name, phone, role, employee_id, password } = updateData;

    // Validate role if provided
    if (role && !["receptionist", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be either 'receptionist' or 'admin'" },
        { status: 400 }
      );
    }

    // Update user basic info
    const updatedUser = await UserService.update(userId, {
      name,
      phone,
      role,
      employee_id,
    });

    // Update password if provided
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await UserService.setPassword(userId, passwordHash);
    }

    return NextResponse.json({
      user: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAdminAuth();

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check for cascade delete option in query params
    const { searchParams } = new URL(request.url);
    const cascadeDelete = searchParams.get("cascade") === "true";

    console.log(
      `Delete user ${userId}, cascade: ${cascadeDelete}, URL: ${request.url}`
    );

    await UserService.permanentDelete(userId, cascadeDelete);

    const message = cascadeDelete
      ? "User and associated appointments deleted successfully"
      : "User deleted successfully";

    return NextResponse.json({
      message,
    });
  } catch (error) {
    console.error("Delete user error:", error);

    // Handle foreign key constraint errors
    if (error instanceof Error) {
      if (error.message.includes("appointment(s) associated")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      if (error.message.includes("foreign key constraint")) {
        return NextResponse.json(
          {
            error:
              "Cannot delete user: they have appointments or other data associated with them",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
