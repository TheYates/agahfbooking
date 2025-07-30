import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db";
import {
  DepartmentService,
  DoctorService,
  UserService,
  SystemSettingsService,
} from "@/lib/db-services";

export async function GET() {
  try {
    // Test basic connection
    const isConnected = await testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Test some basic queries
    const departments = await DepartmentService.getAll();
    const doctors = await DoctorService.getAll();
    const settings = await SystemSettingsService.getAll();

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        departments_count: departments.length,
        doctors_count: doctors.length,
        settings_count: settings.length,
        sample_departments: departments.slice(0, 3),
        sample_doctors: doctors.slice(0, 3),
        sample_settings: settings.slice(0, 3),
      },
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
