import { NextResponse } from "next/server";
import { ClientService } from "@/lib/db-services";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let clients;

    if (search) {
      clients = await ClientService.search(search);
    } else {
      clients = await ClientService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch clients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { xNumber, name, phone, category, emergencyContact, address } = body;

    if (!xNumber || !name || !phone || !category) {
      return NextResponse.json(
        { error: "xNumber, name, phone, and category are required" },
        { status: 400 }
      );
    }

    // Validate X-number format
    const xNumberPattern = /^X\d{5}\/\d{2}$/;
    if (!xNumberPattern.test(xNumber)) {
      return NextResponse.json(
        { error: "X-Number must follow the format X12345/67" },
        { status: 400 }
      );
    }

    const client = await ClientService.create({
      x_number: xNumber,
      name,
      phone,
      category,
      emergency_contact: emergencyContact || null,
      address: address || null,
    });

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error("Error creating client:", error);

    // Handle unique constraint violations (duplicate X-number)
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "A client with this X-Number already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create client",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
