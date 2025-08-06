import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          appointments: [],
          clients: [],
          doctors: [],
          departments: [],
        },
      });
    }

    const searchTerm = `%${query.trim()}%`;

    // Search appointments
    const appointments = await pool.query(
      `SELECT 
        a.id,
        a.date,
        a.slot_number as slotNumber,
        a.status,
        c.name as clientName,
        c.x_number as clientXNumber,
        d.name as doctorName,
        dept.name as departmentName,
        dept.color as departmentColor
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE (
        c.name ILIKE $1 OR 
        c.x_number ILIKE $1 OR 
        d.name ILIKE $1 OR 
        dept.name ILIKE $1 OR
        a.status ILIKE $1
      )
      ORDER BY a.date DESC
      LIMIT 10`,
      [searchTerm]
    );

    // Search clients (only for admin/receptionist)
    let clients = [];
    if (user.role === "admin" || user.role === "receptionist") {
      clients = await pool.query(
        `SELECT 
          id,
          name,
          x_number as xNumber,
          phone,
          category
        FROM clients
        WHERE name ILIKE $1 OR x_number ILIKE $1 OR phone ILIKE $1
        ORDER BY name
        LIMIT 10`,
        [searchTerm]
      );
    }

    // Search doctors
    const doctors = await pool.query(
      `SELECT 
        d.id,
        d.name,
        d.specialization,
        dept.name as departmentName,
        dept.color as departmentColor
      FROM doctors d
      JOIN departments dept ON d.department_id = dept.id
      WHERE d.name ILIKE $1 OR d.specialization ILIKE $1 OR dept.name ILIKE $1
      ORDER BY d.name
      LIMIT 10`,
      [searchTerm]
    );

    // Search departments
    const departments = await pool.query(
      `SELECT 
        id,
        name,
        description,
        color
      FROM departments
      WHERE name ILIKE $1 OR description ILIKE $1
      ORDER BY name
      LIMIT 10`,
      [searchTerm]
    );

    return NextResponse.json({
      success: true,
      data: {
        appointments: appointments.rows,
        clients: clients.rows || [],
        doctors: doctors.rows,
        departments: departments.rows,
      },
    });
  } catch (error) {
    console.error("Universal search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
