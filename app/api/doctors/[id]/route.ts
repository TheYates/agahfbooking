// 🚀 Doctor [id] API - Convex Backend
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestStart = Date.now();

  try {
    const body = await request.json();
    const { id } = await params;

    const { name, department_id } = body;

    if (!name || !department_id) {
      return NextResponse.json(
        { error: "Doctor name and department_id are required" },
        { status: 400 }
      );
    }

    const convexClient = getConvexClient();

    // Update using Convex mutation
    await convexClient.mutation(api.mutations.updateDoctor, {
      id, // Convex document ID
      name,
      department_id,
    });

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Doctor update: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: { _id: id, name, department_id },
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Doctor update error (${responseTime}ms):`, error);
    return NextResponse.json(
      {
        error: "Failed to update doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestStart = Date.now();

  try {
    const { id } = await params;

    const convexClient = getConvexClient();

    // Delete using Convex mutation
    await convexClient.mutation(api.mutations.deleteDoctor, {
      id, // Convex document ID
    });

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Doctor deletion: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      message: "Doctor deleted successfully",
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Doctor deletion error (${responseTime}ms):`, error);
    return NextResponse.json(
      {
        error: "Failed to delete doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
