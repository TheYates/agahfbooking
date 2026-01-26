import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!clientId || clientId === "NaN" || clientId === "undefined" || clientId === "null" || clientId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Valid Client ID is required",
        },
        { status: 400 }
      );
    }

    // Fetch appointments using Convex
    const result = await fetchQuery(api.queries.getClientAppointments, {
      clientId: clientId as Id<"clients">,
      limit,
      offset,
    });

    // Filter by date range if provided
    let filteredAppointments = result.appointments;
    if (startDate || endDate) {
      filteredAppointments = result.appointments.filter((apt: any) => {
        if (startDate && apt.appointment_date < startDate) return false;
        if (endDate && apt.appointment_date > endDate) return false;
        return true;
      });
    }

    const totalCount = filteredAppointments.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Transform the data to match the expected format
    const appointments = filteredAppointments.map((appointment: any) => ({
      id: appointment._id,
      clientId: appointment.client_id,
      clientName: appointment.clientName,
      clientXNumber: appointment.clientXNumber,
      date: appointment.appointment_date,
      slotNumber: appointment.slot_number,
      status: appointment.status,
      notes: appointment.notes,
      departmentId: appointment.department_id,
      departmentName: appointment.departmentName,
      departmentColor: appointment.departmentColor,
      doctorName: appointment.doctorName,
      createdAt: appointment._creationTime,
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
