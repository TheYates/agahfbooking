import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { revokeSession } from "@/lib/session-service"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (sessionId) {
      await revokeSession(sessionId)
    }

    cookieStore.delete("session_id")
    cookieStore.delete("session_token")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
