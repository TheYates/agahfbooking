import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);
    if (isNaN(clientId)) {
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

    // Check if client exists
    const existingClient = await query("SELECT id FROM clients WHERE id = $1", [
      clientId,
    ]);

    if (existingClient.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Update client
    const result = await query(
      `UPDATE clients
       SET name = $1, phone = $2, category = $3, is_active = $4,
           emergency_contact = $5, address = $6, medical_notes = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        name,
        phone,
        category,
        isActive,
        emergencyContact || null,
        address || null,
        medicalNotes || null,
        clientId,
      ]
    );

    const updatedClient = result.rows[0];

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    // Check if client exists
    const existingClient = await query("SELECT id FROM clients WHERE id = $1", [
      clientId,
    ]);

    if (existingClient.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if client has appointments
    const appointments = await query(
      "SELECT COUNT(*) as count FROM appointments WHERE client_id = $1",
      [clientId]
    );

    const appointmentCount = parseInt(appointments.rows[0].count);

    if (appointmentCount > 0) {
      // Instead of deleting, mark as inactive
      await query(
        "UPDATE clients SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [clientId]
      );

      return NextResponse.json({
        success: true,
        message: "Client marked as inactive (has existing appointments)",
      });
    } else {
      // Safe to delete if no appointments
      await query("DELETE FROM clients WHERE id = $1", [clientId]);

      return NextResponse.json({
        success: true,
        message: "Client deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
