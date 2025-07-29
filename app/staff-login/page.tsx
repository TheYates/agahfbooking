"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCheck, Shield } from "lucide-react"

export default function StaffLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    xNumber: "",
    otp: "",
  })
  const [otpSent, setOtpSent] = useState(false)

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleXNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ xNumber: formData.xNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP")
      }

      setOtpSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xNumber: formData.xNumber,
          otp: formData.otp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Shield className="h-6 w-6" />
            Staff Login
          </CardTitle>
          <CardDescription>Access the hospital appointment system</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="username" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="username" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Username
              </TabsTrigger>
              <TabsTrigger value="xnumber" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                X-Number
              </TabsTrigger>
            </TabsList>

            <TabsContent value="username" className="space-y-4">
              <form onSubmit={handleUsernameLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="xnumber" className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleXNumberSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="staff-xnumber">Staff X-Number</Label>
                    <Input
                      id="staff-xnumber"
                      type="text"
                      placeholder="R00001/00 or A00001/00"
                      value={formData.xNumber}
                      onChange={(e) => setFormData({ ...formData, xNumber: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="staff-otp">OTP Code</Label>
                    <Input
                      id="staff-otp"
                      type="text"
                      placeholder="123456"
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                      maxLength={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setOtpSent(false)}
                  >
                    Back to X-Number
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Demo Credentials:</p>
            <p>Username: admin / Password: admin123</p>
            <p>Username: receptionist / Password: recep123</p>
            <p>X-Numbers: R00001/00, A00001/00 (OTP: 123456)</p>
          </div>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => router.push("/login")}>
              Patient Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
