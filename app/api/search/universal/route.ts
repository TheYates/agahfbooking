import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { pool } from "@/lib/db";
import type { QueryResult } from "pg";
import { MemoryCache } from "@/lib/memory-cache";

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
          departments: [],
        },
      });
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `search_universal_${normalizedQuery}_${user.role}`;

    const results = await MemoryCache.get(
      cacheKey,
      async () => {
        return await performUniversalSearch(normalizedQuery, user.role);
      },
      'search' // 10 second cache
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Universal search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform search",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function performUniversalSearch(query: string, userRole: string) {
    const searchTerm = `%${query}%`;

    // Search appointments
    const appointments: QueryResult<any> = await pool.query(
      `SELECT 
        a.id,
        a.appointment_date as date,
        a.slot_number as slotNumber,
        a.status,
        c.name as clientName,
        c.x_number as clientXNumber,
        dept.name as departmentName,
        dept.color as departmentColor
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE (
        c.name ILIKE $1 OR 
        c.x_number ILIKE $1 OR 
        dept.name ILIKE $1 OR
        a.status ILIKE $1
      )
      ORDER BY a.appointment_date DESC
      LIMIT 10`,
      [searchTerm]
    );

    // Search clients (only for admin/receptionist)
    let clients: QueryResult<any> | null = null;
    if (userRole === "admin" || userRole === "receptionist") {
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

    // Search departments
    const departments: QueryResult<any> = await pool.query(
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

    return {
      appointments: appointments.rows,
      clients: clients?.rows || [],
      departments: departments.rows,
    };
}
