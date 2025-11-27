import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Helper function to map sort columns to database columns
function getSortColumn(sortBy: string): string {
  const columnMap: { [key: string]: string } = {
    name: "c.name",
    xNumber: "c.x_number",
    phone: "c.phone",
    category: "c.category",
    joinDate: "c.created_at",
    totalAppointments: "COUNT(a.id)",
    lastAppointment: "MAX(a.appointment_date)",
    status: "status",
  };
  return columnMap[sortBy] || "c.name";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const offset = (page - 1) * limit;

    // Build the WHERE clause based on filters
    let whereConditions = ["c.is_active = true"];
    const queryParams: any[] = [];
    let paramCount = 1;

    if (clientId) {
      whereConditions.push(`c.id = $${paramCount}`);
      queryParams.push(parseInt(clientId));
      paramCount++;
    }

    if (search) {
      whereConditions.push(
        `(c.name ILIKE $${paramCount} OR c.x_number ILIKE $${paramCount} OR c.phone ILIKE $${paramCount})`
      );
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (category && category !== "all") {
      whereConditions.push(`c.category = $${paramCount}`);
      queryParams.push(category);
      paramCount++;
    }

    // For status filter, we'll consider clients with recent appointments as "active"
    // and those without recent appointments (or no appointments) as "inactive"
    let statusCondition = "";
    if (status === "active") {
      statusCondition =
        "HAVING MAX(a.appointment_date) >= CURRENT_DATE - INTERVAL '90 days' OR COUNT(a.id) = 0";
    } else if (status === "inactive") {
      statusCondition =
        "HAVING MAX(a.appointment_date) < CURRENT_DATE - INTERVAL '90 days' AND COUNT(a.id) > 0";
    }

    const queryText = `
      SELECT
        c.id,
        c.x_number,
        c.name,
        c.phone,
        c.category,
        c.emergency_contact,
        c.address,
        c.medical_notes,
        c.created_at as join_date,
        COUNT(a.id) as total_appointments,
        MAX(a.appointment_date) as last_appointment,
        CASE
          WHEN MAX(a.appointment_date) >= CURRENT_DATE - INTERVAL '90 days' OR COUNT(a.id) = 0
          THEN 'active'
          ELSE 'inactive'
        END as status
      FROM clients c
      LEFT JOIN appointments a ON c.id = a.client_id
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY c.id, c.x_number, c.name, c.phone, c.category, c.emergency_contact, c.address, c.medical_notes, c.created_at
      ${statusCondition}
      ORDER BY ${getSortColumn(sortBy)} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Get total count for pagination (simpler query without grouping)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM clients c
      WHERE ${whereConditions.join(" AND ")}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset params

    // Transform the data to match the expected interface
    const clients = result.rows.map((row: any) => ({
      id: row.id,
      xNumber: row.x_number,
      name: row.name,
      phone: row.phone,
      category: row.category,
      joinDate: row.join_date.toISOString().split("T")[0], // Format as YYYY-MM-DD
      totalAppointments: parseInt(row.total_appointments) || 0,
      lastAppointment: row.last_appointment
        ? row.last_appointment.toISOString().split("T")[0]
        : null,
      status: row.status,
      emergencyContact: row.emergency_contact,
      address: row.address,
      medicalNotes: row.medical_notes,
    }));

    const totalCount = parseInt(countResult.rows[0]?.total || "0");
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching clients with stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch clients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
