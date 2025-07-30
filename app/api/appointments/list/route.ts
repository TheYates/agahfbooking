import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const dateFilter = searchParams.get("dateFilter");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const whereConditions = ["1=1"]; // Always true condition to start
    const queryParams: any[] = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      whereConditions.push(`(
        c.name ILIKE $${paramCount} OR 
        c.x_number ILIKE $${paramCount} OR 
        d.name ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    // Status filter
    if (status && status !== "all") {
      paramCount++;
      whereConditions.push(`a.status = $${paramCount}`);
      queryParams.push(status);
    }

    // Date filter
    if (dateFilter && dateFilter !== "all") {
      const today = new Date().toISOString().split("T")[0];
      switch (dateFilter) {
        case "today":
          paramCount++;
          whereConditions.push(`DATE(a.appointment_date) = DATE($${paramCount})`);
          queryParams.push(today);
          break;
        case "upcoming":
          paramCount++;
          whereConditions.push(`DATE(a.appointment_date) >= DATE($${paramCount})`);
          queryParams.push(today);
          break;
        case "past":
          paramCount++;
          whereConditions.push(`DATE(a.appointment_date) < DATE($${paramCount})`);
          queryParams.push(today);
          break;
      }
    }

    // Main query to fetch appointments with client and department info
    const appointmentsQuery = `
      SELECT 
        a.id,
        a.client_id,
        c.name as client_name,
        c.x_number as client_x_number,
        c.phone as client_phone,
        c.category as client_category,
        a.department_id,
        d.name as department_name,
        a.appointment_date,
        a.slot_number,
        a.status,
        a.notes,
        a.created_at
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY a.appointment_date DESC, a.slot_number ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const result = await query(appointmentsQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE ${whereConditions.join(" AND ")}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
    const totalCount = parseInt(countResult.rows[0]?.total || "0");
    const totalPages = Math.ceil(totalCount / limit);

    // Transform the data to match the expected interface
    const appointments = result.rows.map((row: any) => {
      // Determine status color based on status
      let statusColor = "#6B7280"; // Default gray
      switch (row.status) {
        case "scheduled":
        case "booked":
          statusColor = "#3B82F6"; // Blue
          break;
        case "confirmed":
          statusColor = "#8B5CF6"; // Purple
          break;
        case "arrived":
          statusColor = "#10B981"; // Green
          break;
        case "waiting":
          statusColor = "#F59E0B"; // Yellow
          break;
        case "completed":
          statusColor = "#059669"; // Emerald
          break;
        case "no_show":
          statusColor = "#EF4444"; // Red
          break;
        case "cancelled":
          statusColor = "#6B7280"; // Gray
          break;
      }

      return {
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        clientXNumber: row.client_x_number,
        doctorId: row.department_id, // Using department as doctor for now
        doctorName: row.department_name,
        date: row.appointment_date.toISOString().split("T")[0],
        slotNumber: row.slot_number,
        status: row.status,
        statusColor,
        notes: row.notes,
        phone: row.client_phone,
        category: row.client_category,
      };
    });

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
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
