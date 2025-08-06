"use client";

// This component is BetterAuth-ready and uses the updated API endpoints
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

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"xnumber" | "otp">("xnumber");
  const [xNumber, setXNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [mockOtp, setMockOtp] = useState("");
  const [otpToken, setOtpToken] = useState(""); // JWT token for OTP verification
  const [isMockMode, setIsMockMode] = useState(false); // Track if we're in mock mode
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remainingAttempts?: number;
    requiresCaptcha?: boolean;
    resetTime?: number;
  } | null>(null);

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
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ xNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429 && data.rateLimited) {
          const resetTime = data.resetTime ? new Date(data.resetTime) : null;
          const resetTimeStr = resetTime
            ? resetTime.toLocaleTimeString()
            : "later";

          if (data.blockDuration) {
            throw new Error(
              `Too many attempts. Please wait ${data.blockDuration} minutes before trying again.`
            );
          } else {
            throw new Error(
              `Rate limit exceeded. Please try again at ${resetTimeStr}.`
            );
          }
        }

        throw new Error(data.error || "Failed to send OTP");
      }

      if (data.maskedPhone) {
        setMaskedPhone(data.maskedPhone);
      }

      // Store JWT token for OTP verification
      if (data.token) {
        setOtpToken(data.token);
      }

      // Check if we're in mock mode and store OTP for display
      if (data.otp) {
        setMockOtp(data.otp);
        setIsMockMode(true);
      } else {
        setIsMockMode(false);
      }

      // Store rate limiting information
      if (data.rateLimitInfo) {
        setRateLimitInfo(data.rateLimitInfo);
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

  const verifyOtp = async (otpValue: string) => {
    if (otpValue.length !== 6 || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: otpToken, otp: otpValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      router.push(data.redirectUrl || "/dashboard");
      router.refresh();
    } catch (err) {
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
        verifyOtp(value);
      }, 500);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }
    await verifyOtp(otp);
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <div className="bg-muted relative hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=center"
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
                    <div className="mb-2 flex justify-center">
                      <img
                        src="/agahflogo.svg"
                        alt="AGAHF Logo"
                        className="h-24 w-24 object-contain dark:hidden"
                      />
                      <img
                        src="/agahflogo white.svg"
                        alt="AGAHF Logo"
                        className="h-24 w-24 object-contain hidden dark:block"
                      />
                    </div>
                    <h1 className="text-2xl font-bold">
                      {step === "xnumber" ? "Welcome back" : "Verify OTP"}
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      {step === "xnumber"
                        ? "Login to your AGAHF account"
                        : maskedPhone
                        ? `Enter the OTP sent to ${maskedPhone}`
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
                                This OTP is displayed because you're in mock
                                mode
                              </p>
                            </div>
                          </div>
                        )}

                        {rateLimitInfo &&
                          rateLimitInfo.remainingAttempts !== undefined &&
                          rateLimitInfo.remainingAttempts < 5 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <div className="text-center">
                                <p className="text-sm text-yellow-800">
                                  ⚠️{" "}
                                  <strong>
                                    {rateLimitInfo.remainingAttempts}
                                  </strong>{" "}
                                  attempts remaining
                                </p>
                                {rateLimitInfo.requiresCaptcha && (
                                  <p className="text-xs text-yellow-700 mt-1">
                                    Additional verification may be required
                                    after more failed attempts
                                  </p>
                                )}
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
          {/* <div className="text-muted-foreground text-center text-xs text-balance">
            By clicking continue, you agree to our{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </div> */}
        </div>
      </div>
    </div>
  );
}
