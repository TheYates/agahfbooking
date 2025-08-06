import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Client ID is required",
        },
        { status: 400 }
      );
    }

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total FROM appointments WHERE client_id = $1`,
      [clientId]
    );
    const totalCount = parseInt(countResult.rows[0]?.total || "0");
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch appointments for the specific client with pagination
    const result = await query(
      `
      SELECT
        a.id,
        a.client_id,
        c.name as client_name,
        c.x_number as client_x_number,
        a.appointment_date as date,
        a.slot_number,
        a.status,
        a.notes,
        a.created_at,
        a.department_id,
        d.name as department_name,
        COALESCE(d.color, '#3B82F6') as department_color,
        COALESCE(doc.name, 'Dr. Smith') as doctor_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN doctors doc ON a.doctor_id = doc.id
      WHERE a.client_id = $1
      ORDER BY a.appointment_date DESC, a.slot_number ASC
      LIMIT $2 OFFSET $3
    `,
      [clientId, limit, offset]
    );

    // Transform the data to match the expected format
    const appointments = result.rows.map((row: any) => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      clientXNumber: row.client_x_number,
      date:
        row.date instanceof Date
          ? row.date.toISOString().split("T")[0]
          : row.date,
      slotNumber: row.slot_number,
      status: row.status,
      notes: row.notes,
      departmentId: row.department_id,
      departmentName: row.department_name,
      departmentColor: row.department_color,
      doctorName: row.doctor_name,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching client appointments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
