import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/db-services";
import { requireAdminAuth } from "@/lib/auth-server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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

    const supabase = createAdminSupabaseClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
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
    const { name, phone, role, username, password } = updateData;

    // Validate role if provided
    if (role && !["receptionist", "admin", "reviewer"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be either 'receptionist', 'admin', or 'reviewer'" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Build update object
    const updateObj: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (name !== undefined) updateObj.name = name;
    if (phone !== undefined) updateObj.phone = phone || null;
    if (role !== undefined) updateObj.role = role;
    if (username !== undefined) updateObj.username = username;

    // Update password if provided
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateObj.password_hash = passwordHash;
    }

    // Update user in Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateObj)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
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
        { error: "Username already exists" },
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

    const supabase = createAdminSupabaseClient();

    // If cascade delete, first delete all appointments
    if (cascadeDelete) {
      const { error: deleteApptsError } = await supabase
        .from("appointments")
        .delete()
        .eq("booked_by", userId);

      if (deleteApptsError) {
        throw new Error("Failed to delete user's appointments");
      }
    } else {
      // Check if user has appointments
      const { data: appointments, error: checkError } = await supabase
        .from("appointments")
        .select("id")
        .eq("booked_by", userId)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (appointments && appointments.length > 0) {
        return NextResponse.json(
          { error: "User has appointment(s) associated with them. Enable cascade delete to remove them." },
          { status: 409 }
        );
      }
    }

    // Delete the user
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      throw deleteError;
    }

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
