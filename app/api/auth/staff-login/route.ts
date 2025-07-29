import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Mock staff authentication
    let userData = null

    if (username === "admin" && password === "admin123") {
      userData = {
        id: 4,
        xNumber: "A00001/00",
        name: "Dr. Admin",
        phone: "+9988776655",
        category: "STAFF",
        role: "admin",
      }
    } else if (username === "receptionist" && password === "recep123") {
      userData = {
        id: 3,
        xNumber: "R00001/00",
        name: "Mary Johnson",
        phone: "+1122334455",
        category: "STAFF",
        role: "receptionist",
      }
    } else {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Set secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error("Staff login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
