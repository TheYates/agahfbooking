import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { xNumber, otp } = await request.json()

    // Mock: Verify OTP (in real app, check against database)
    if (otp !== "123456") {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    // Mock: Get user data
    const mockUsers = [
      { id: 1, xNumber: "X12345/67", name: "John Doe", phone: "+1234567890", category: "PRIVATE CASH", role: "client" },
      {
        id: 2,
        xNumber: "X98765/43",
        name: "Jane Smith",
        phone: "+0987654321",
        category: "PUBLIC SPONSORED(NHIA)",
        role: "client",
      },
      {
        id: 3,
        xNumber: "R00001/00",
        name: "Mary Johnson",
        phone: "+1122334455",
        category: "STAFF",
        role: "receptionist",
      },
      { id: 4, xNumber: "A00001/00", name: "Dr. Admin", phone: "+9988776655", category: "STAFF", role: "admin" },
    ]

    const user = mockUsers.find((u) => u.xNumber === xNumber)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create session token (in real app, use JWT or secure session)
    const sessionData = {
      id: user.id,
      xNumber: user.xNumber,
      name: user.name,
      phone: user.phone,
      category: user.category,
      role: user.role,
      loginTime: new Date().toISOString(),
    }

    // Set secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: sessionData,
      redirectUrl: user.role === "client" ? "/dashboard" : "/dashboard",
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
