"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useConvexAuth } from "@/hooks/use-convex-auth";

export default function LoginPage() {
  const router = useRouter();
  const { sendOTP, verifyOTP } = useConvexAuth();
  
  const [step, setStep] = useState<"xnumber" | "otp">("xnumber");
  const [xNumber, setXNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mockOtp, setMockOtp] = useState("");
  const [isMockMode, setIsMockMode] = useState(false);

  const handleXNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, "");

    if (value.length > 7) {
      value = value.slice(0, 7);
    }

    let formatted = "X";
    if (value.length > 0) {
      formatted += value.slice(0, 5);
      if (value.length > 5) {
        formatted += "/" + value.slice(5);
      }
    }

    setXNumber(formatted);

    if (error) {
      setError("");
    }
  };

  const handleXNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const digitsOnly = xNumber.replace(/[^0-9]/g, "");
    if (digitsOnly.length !== 7 || !xNumber.match(/^X\d{5}\/\d{2}$/)) {
      setError("Please enter a complete X-number (7 digits required)");
      setLoading(false);
      return;
    }

    try {
      // Call Convex OTP function
      const result = await sendOTP(xNumber, "client");

      // Check if we're in development mode (mock OTP)
      if (result.otp) {
        setMockOtp(result.otp);
        setIsMockMode(true);
      } else {
        setIsMockMode(false);
      }

      setStep("otp");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpCode = async (otpValue: string) => {
    if (otpValue.length !== 6 || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Verifying OTP:", { xNumber, otpValue });
      
      // Call Convex OTP verification
      const result = await verifyOTP(xNumber, otpValue, "client");
      
      console.log("Verification result:", result);
      console.log("Verification result.user:", JSON.stringify(result.user, null, 2));

      if (result.success && result.user) {
        // User is automatically stored in localStorage by useConvexAuth
        console.log("Login successful, setting cookie and redirecting...");
        
        // Format user data for middleware (expects xNumber not x_number)
        const sessionData = {
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
          xNumber: result.user.xNumber || result.user.x_number, // Middleware expects xNumber
          category: result.user.category,
          role: result.user.role,
          convexId: result.user.convexId || result.user.id, // Use convexId if present, otherwise use id
        };

        console.log("Setting session cookie. User data:", sessionData);
        
        // Set session cookie for middleware
        document.cookie = `session_token=${JSON.stringify(sessionData)}; path=/; max-age=86400`; // 24 hours
        
        router.push("/dashboard");
        router.refresh();
      } else {
        throw new Error("Failed to verify OTP");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify OTP. Please try again."
      );
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      setTimeout(() => {
        verifyOtpCode(value);
      }, 500);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }
    await verifyOtpCode(otp);
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <div className="bg-muted relative hidden md:block">
                <img
                  src="https://images.pexels.com/photos/34862508/pexels-photo-34862508.jpeg"
                  alt="Hospital Interior"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.6] dark:grayscale"
                />
              </div>
              <form
                className="p-8 md:p-12"
                onSubmit={
                  step === "xnumber" ? handleXNumberSubmit : handleOtpSubmit
                }
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex flex-col items-center gap-2">
                      <img
                        src="/agahflogo.svg"
                        alt="AGAHF Logo"
                        className="h-20 w-20 object-contain dark:hidden"
                      />
                      <img
                        src="/agahflogo white.svg"
                        alt="AGAHF Logo"
                        className="h-20 w-20 object-contain hidden dark:block"
                      />
                      <h2 className="text-lg font-bold tracking-tight">AGAHF BOOKING</h2>
                    </div>
                    <h1 className="text-2xl font-bold">
                      {step === "xnumber" ? "Welcome back" : "Verify OTP"}
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      {step === "xnumber"
                        ? "Login to your account"
                        : "Enter the OTP sent to your phone"}
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {step === "xnumber" ? (
                    <>
                      <div className="grid gap-3">
                        <Label htmlFor="xnumber">X-Number</Label>
                        <Input
                          id="xnumber"
                          type="text"
                          placeholder="X12345/67"
                          value={xNumber}
                          onChange={handleXNumberChange}
                          maxLength={10}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        {loading ? "Sending OTP..." : "Send OTP"}
                      </Button>
                      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                        <span className="relative z-10 bg-card px-2 text-muted-foreground">
                          Or continue as
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        type="button"
                        className="w-full"
                        asChild
                      >
                        <Link href="/staff-login">
                          <Shield className="h-4 w-4 mr-2" />
                          Staff Login
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-3">
                        <Label htmlFor="otp">OTP Code</Label>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={handleOtpChange}
                            disabled={loading}
                            autoFocus
                          >
                            <InputOTPGroup className="gap-3">
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          {loading && otp.length === 6
                            ? "Verifying OTP..."
                            : "Enter the 6-digit code sent to your phone"}
                        </p>
                        {isMockMode && mockOtp && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-center space-y-2">
                              <p className="text-sm text-blue-700 font-medium">
                                🧪 Development Mode - Mock OTP
                              </p>
                              <div className="bg-white border border-blue-300 rounded-md p-3">
                                <p className="text-xs text-blue-600 mb-1">
                                  Your OTP Code:
                                </p>
                                <p className="font-mono font-bold text-2xl text-blue-800 tracking-wider">
                                  {mockOtp}
                                </p>
                              </div>
                              <p className="text-xs text-blue-600">
                                This OTP is displayed because you're in development mode
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || otp.length !== 6}
                      >
                        {loading
                          ? "Verifying..."
                          : otp.length === 6
                          ? "Auto-verifying..."
                          : "Verify OTP"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setStep("xnumber");
                          setMockOtp("");
                          setOtp("");
                        }}
                      >
                        Back to X-Number
                      </Button>
                    </>
                  )}

                  <div className="text-center text-sm">
                    Need help?{" "}
                    <a href="#" className="underline underline-offset-4">
                      Contact support
                    </a>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
