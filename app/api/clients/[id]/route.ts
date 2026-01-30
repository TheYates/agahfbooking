import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id, 10);
    if (Number.isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      category,
      status,
      emergencyContact,
      address,
      medicalNotes,
    } = body;

    // Validate required fields
    if (!name || !phone || !category || !status) {
      return NextResponse.json(
        { error: "Name, phone, category, and status are required" },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      "PRIVATE CASH",
      "PUBLIC SPONSORED(NHIA)",
      "PRIVATE SPONSORED",
      "PRIVATE DEPENDENT",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Validate status and convert to boolean
    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be either 'active' or 'inactive'" },
        { status: 400 }
      );
    }
    const isActive = status === "active";

    const supabase = createServerSupabaseClient();

    // Check if client exists
    const { data: existing, error: existErr } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (existErr || !existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Update client
    const { data: updatedClient, error: updateErr } = await supabase
      .from("clients")
      .update({
        name,
        phone,
        category,
        is_active: isActive,
        emergency_contact: emergencyContact || null,
        address: address || null,
        medical_notes: medicalNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select(
        "id,x_number,name,phone,category,is_active,emergency_contact,address,medical_notes,created_at,updated_at"
      )
      .single();

    if (updateErr) throw new Error(updateErr.message);

    return NextResponse.json({
      success: true,
      message: "Client updated successfully",
      data: {
        id: updatedClient.id,
        xNumber: updatedClient.x_number,
        name: updatedClient.name,
        phone: updatedClient.phone,
        category: updatedClient.category,
        status: updatedClient.is_active ? "active" : "inactive",
        emergencyContact: updatedClient.emergency_contact,
        address: updatedClient.address,
        medicalNotes: updatedClient.medical_notes,
        joinDate: updatedClient.created_at,
        updatedAt: updatedClient.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id, 10);
    if (Number.isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if client exists
    const { data: existing, error: existErr } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (existErr || !existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if client has appointments
    const { count, error: countErr } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId);

    if (countErr) throw new Error(countErr.message);

    const appointmentCount = count || 0;

    if (appointmentCount > 0) {
      // Instead of deleting, mark as inactive
      const { error: updateErr } = await supabase
        .from("clients")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", clientId);

      if (updateErr) throw new Error(updateErr.message);

      return NextResponse.json({
        success: true,
        message: "Client marked as inactive (has existing appointments)",
      });
    }

    // Safe to delete if no appointments
    const { error: deleteErr } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (deleteErr) throw new Error(deleteErr.message);

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
