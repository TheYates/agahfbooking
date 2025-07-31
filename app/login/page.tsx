"use client";

import type React from "react";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const handleXNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers

    if (value.length > 7) {
      value = value.slice(0, 7); // Limit to 7 digits
    }

    // Format as X12345/67
    let formatted = "X";
    if (value.length > 0) {
      formatted += value.slice(0, 5);
      if (value.length > 5) {
        formatted += "/" + value.slice(5);
      }
    }

    setXNumber(formatted);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleXNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate X-number format
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
        throw new Error(data.error || "Failed to send OTP");
      }

      // Store the masked phone number for display
      if (data.maskedPhone) {
        setMaskedPhone(data.maskedPhone);
      }

      // Store mock OTP for display (when in mock mode)
      if (data.otp) {
        setMockOtp(data.otp);
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
        body: JSON.stringify({ xNumber, otp: otpValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      // Redirect to dashboard
      router.push(data.redirectUrl || "/dashboard");
      router.refresh(); // Force a refresh to update the auth state
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
    // Auto-verify when 6 digits are entered with a small delay
    if (value.length === 6) {
      setTimeout(() => {
        verifyOtp(value);
      }, 500); // 500ms delay for better UX
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Hospital Appointment System
          </CardTitle>
          <CardDescription>
            {step === "xnumber"
              ? "Enter your X-number to continue"
              : maskedPhone
              ? `Enter the OTP sent to ${maskedPhone}`
              : "Enter the OTP sent to your phone"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === "xnumber" ? (
            <form onSubmit={handleXNumberSubmit} className="space-y-4">
              <div>
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
                <p className="text-sm text-gray-500 mt-1">Format: X12345/67</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    disabled={loading}
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
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {loading && otp.length === 6
                    ? "Verifying OTP..."
                    : maskedPhone
                    ? `Enter the 6-digit code sent to ${maskedPhone}`
                    : "Enter the 6-digit code sent to your phone"}
                </p>
                {mockOtp && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 text-center">
                      🧪 <strong>Mock Mode:</strong> Your OTP is{" "}
                      <span className="font-mono font-bold text-lg">
                        {mockOtp}
                      </span>
                    </p>
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
                className="w-full bg-transparent"
                onClick={() => {
                  setStep("xnumber");
                  setMockOtp("");
                  setOtp("");
                }}
              >
                Back to X-Number
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Enter your registered X-number to receive an OTP via SMS</p>
          </div>

          {/* Staff Login Link */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link href="/staff-login">
              <Button variant="outline" className="w-full bg-transparent">
                <Shield className="h-4 w-4 mr-2" />
                Staff Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
