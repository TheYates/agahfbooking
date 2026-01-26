// 🚀 Doctors API - Convex Backend
// Migrated from PostgreSQL to Convex

import { NextResponse } from "next/server";
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("@/convex/_generated/api");

export async function GET(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    // Use Convex instead of PostgreSQL
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("Convex URL not configured");
    }

    const convexClient = new ConvexHttpClient(convexUrl);

    let doctors;

    if (departmentId) {
      // Get doctors for specific department
      // Note: Convex uses document IDs, so we need to handle this appropriately
      // For now, get all doctors and filter, or pass department_id if it's a Convex ID
      const allDoctors = await convexClient.query(api.queries.getDoctors, {
        isActive: true,
      });
      
      // Filter by department if departmentId looks like a Convex ID
      if (departmentId.includes(":")) {
        doctors = allDoctors.filter((d: any) => d.department_id === departmentId);
      } else {
        // Legacy numeric ID - return all doctors for now
        doctors = allDoctors;
      }
    } else {
      // Get all active doctors
      doctors = await convexClient.query(api.queries.getDoctors, {
        isActive: true,
      });
    }

    // Enrich with department info
    const departments = await convexClient.query(api.queries.getDepartments, {});
    const departmentMap = new Map(departments.map((d: any) => [d._id, d]));

    const enrichedDoctors = doctors.map((doctor: any) => {
      const department: any = departmentMap.get(doctor.department_id);
      return {
        ...doctor,
        id: doctor._id, // Add id field for backward compatibility
        department_name: department?.name || "Unknown",
        department_color: department?.color || "#3B82F6",
      };
    });

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Doctors API: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: enrichedDoctors,
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Doctors API error (${responseTime}ms):`, error);
    return NextResponse.json(
      {
        error: "Failed to fetch doctors",
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
    const { name, department_id } = body;

    if (!name || !department_id) {
      return NextResponse.json(
        { error: "Doctor name and department_id are required" },
        { status: 400 }
      );
    }

    // Use Convex instead of PostgreSQL
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("Convex URL not configured");
    }

    const convexClient = new ConvexHttpClient(convexUrl);

    const doctorId = await convexClient.mutation(api.mutations.createDoctor, {
      name,
      department_id, // Should be a Convex document ID
    });

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Doctor creation: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: { _id: doctorId, name, department_id },
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Doctor creation error (${responseTime}ms):`, error);
    return NextResponse.json(
      {
        error: "Failed to create doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
