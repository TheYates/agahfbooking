import { type NextRequest, NextResponse } from "next/server";
import { 
  withAuth, 
  validateXNumberAccess, 
  AuthErrors,
  type SessionData 
} from "@/lib/api-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Example: Secure API route for client appointments
 * Only allows clients to see their own appointments
 */
async function getClientAppointmentsHandler(
  request: NextRequest,
  session: SessionData
) {
  // Get x-number from query params or session
  const { searchParams } = new URL(request.url);
  const requestedXNumber = searchParams.get("xNumber");

  // Validate x-number format
  if (!requestedXNumber) {
    return AuthErrors.invalidXNumber();
  }

  // Check if client can access this x-number
  if (!validateXNumberAccess(session, requestedXNumber)) {
    return AuthErrors.xNumberMismatch();
  }

  // Fetch appointments using admin client
  const supabase = createAdminSupabaseClient();
  
  // First get client ID from x-number
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("x_number", requestedXNumber)
    .single();

  if (clientError || !client) {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  // Then get appointments
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      slot_number,
      status,
      notes,
      departments (name),
      clients (name, x_number)
    `)
    .eq("client_id", client.id)
    .order("appointment_date", { ascending: false });

  if (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: appointments || [],
    xNumber: requestedXNumber,
    accessedBy: session.name,
  });
}

// Export route with auth middleware - requires client login
export const GET = withAuth(getClientAppointmentsHandler, { 
  requireClient: true 
});

/**
 * Example: Secure API route for creating appointments
 * Only staff can create appointments for any client
 * Clients can only create for themselves
 */
async function createAppointmentHandler(
  request: NextRequest,
  session: SessionData
) {
  try {
    const body = await request.json();
    const { xNumber, departmentId, appointmentDate, slotNumber, notes } = body;

    // Validate required fields
    if (!xNumber || !departmentId || !appointmentDate || !slotNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check x-number access
    if (!validateXNumberAccess(session, xNumber)) {
      return AuthErrors.xNumberMismatch();
    }

    // Get client ID
    const supabase = createAdminSupabaseClient();
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name")
      .eq("x_number", xNumber)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check if slot is available
    const { data: existingAppointment, error: checkError } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", appointmentDate)
      .eq("slot_number", slotNumber)
      .eq("department_id", departmentId)
      .single();

    if (existingAppointment) {
      return NextResponse.json(
        { error: "Slot already booked" },
        { status: 409 }
      );
    }

    // Create appointment
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        client_id: client.id,
        department_id: departmentId,
        appointment_date: appointmentDate,
        slot_number: slotNumber,
        status: "booked",
        notes: notes || null,
        booked_by: session.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating appointment:", insertError);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment,
      message: `Appointment booked for ${client.name}`,
    });

  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export route with auth middleware - allows both client and staff
export const POST = withAuth(createAppointmentHandler);
