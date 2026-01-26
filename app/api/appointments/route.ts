// 🚀 Appointments API - Convex Backend
// Migrated from PostgreSQL to Convex

import { NextResponse } from "next/server";
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("@/convex/_generated/api");

// Helper to get Convex client
function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Convex URL not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function GET(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");
    const date = searchParams.get("date");

    const convexClient = getConvexClient();
    let appointments;

    if (departmentId && date) {
      // Get appointments for specific department and date
      appointments = await convexClient.query(api.queries.getAppointmentsByDateRange, {
        startDate: date,
        endDate: date,
        department_id: departmentId, // Convex ID
      });
    } else if (startDate && endDate) {
      // Get appointments for date range
      appointments = await convexClient.query(api.queries.getAppointmentsByDateRange, {
        startDate,
        endDate,
      });
    } else {
      // Default: get appointments for today
      const today = new Date().toISOString().split("T")[0];
      appointments = await convexClient.query(api.queries.getAppointmentsByDateRange, {
        startDate: today,
        endDate: today,
      });
    }

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Appointments API: ${responseTime}ms, ${appointments.length} results`);

    return NextResponse.json({
      success: true,
      data: appointments,
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Appointments API error (${responseTime}ms):`, error);
    return NextResponse.json(
      {
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestStart = Date.now();

  try {
    const body = await request.json();

    // Validate required fields
    const {
      client_id,
      department_id,
      appointment_date,
      slot_number,
      booked_by,
    } = body;

    if (
      !client_id ||
      !department_id ||
      !appointment_date ||
      !slot_number ||
      !booked_by
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: client_id, department_id, appointment_date, slot_number, booked_by",
        },
        { status: 400 }
      );
    }

    // Validate appointment date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDateObj = new Date(appointment_date);
    appointmentDateObj.setHours(0, 0, 0, 0);

    if (appointmentDateObj < today) {
      return NextResponse.json(
        { error: "Cannot book appointments in the past" },
        { status: 400 }
      );
    }

    const convexClient = getConvexClient();

    const appointmentId = await convexClient.mutation(api.mutations.createAppointment, {
      client_id,
      department_id,
      doctor_id: body.doctor_id || undefined, // optional specific doctor
      appointment_date,
      slot_number: parseInt(slot_number),
      notes: body.notes || "",
      booked_by,
    });

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Appointment creation: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: { _id: appointmentId, appointment_date, slot_number },
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Appointment creation error (${responseTime}ms):`, error);
    return NextResponse.json(
      {
        error: "Failed to create appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const requestStart = Date.now();

  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const convexClient = getConvexClient();

    await convexClient.mutation(api.mutations.updateAppointment, {
      id,
      status,
      notes,
    });

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Appointment update: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: { _id: id, status, notes },
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Appointment update error (${responseTime}ms):`, error);
    return NextResponse.json(
      {
        error: "Failed to update appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const convexClient = getConvexClient();

    await convexClient.mutation(api.mutations.deleteAppointment, {
      id,
    });

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Appointment deletion: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Appointment deletion error (${responseTime}ms):`, error);
    return NextResponse.json(
      {
        error: "Failed to delete appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
