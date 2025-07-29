import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { xNumber } = await request.json()

    // Validate X-number format
    const xNumberRegex = /^X\d{5}\/\d{2}$/
    if (!xNumberRegex.test(xNumber)) {
      return NextResponse.json({ error: "Invalid X-number format" }, { status: 400 })
    }

    // Mock: Check if user exists in database
    const mockUsers = [
      { xNumber: "X12345/67", name: "John Doe", phone: "+1234567890", category: "PRIVATE CASH", role: "client" },
      {
        xNumber: "X98765/43",
        name: "Jane Smith",
        phone: "+0987654321",
        category: "PUBLIC SPONSORED(NHIA)",
        role: "client",
      },
      { xNumber: "R00001/00", name: "Mary Johnson", phone: "+1122334455", category: "STAFF", role: "receptionist" },
      { xNumber: "A00001/00", name: "Dr. Admin", phone: "+9988776655", category: "STAFF", role: "admin" },
    ]

    const user = mockUsers.find((u) => u.xNumber === xNumber)
    if (!user) {
      return NextResponse.json({ error: "X-number not found" }, { status: 404 })
    }

    // Mock: Generate and store OTP (in real app, save to database and send SMS)
    const otp = "123456" // Mock OTP
    console.log(`Sending OTP ${otp} to ${user.phone} for ${xNumber}`)

    // In real implementation:
    // 1. Generate random 6-digit OTP
    // 2. Store in database with expiration
    // 3. Send SMS to user's phone

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
