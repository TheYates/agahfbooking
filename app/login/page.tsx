"use client";

import React from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Shield, Clock } from "lucide-react";
import Link from "next/link";
import { authActions } from "@/lib/auth-client";
import { PrivacyPolicyDialog } from "@/components/dialogs/privacy-policy-dialog";
import { HelpCenterDialog } from "@/components/dialogs/help-center-dialog";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sendOTP = authActions.sendOTP;
  const verifyOTP = authActions.verifyOTP;
  
  const [step, setStep] = useState<"xnumber" | "otp">("xnumber");
  const [xNumber, setXNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mockOtp, setMockOtp] = useState("");
  const [isMockMode, setIsMockMode] = useState(false);

  const timeoutMessage = searchParams.get("reason") === "timeout" 
    ? "You were logged out due to inactivity. Please log in again to continue."
    : "";

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
      const result = await sendOTP(xNumber);

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
      
      const result = await verifyOTP(xNumber, otpValue);
      
      console.log("Verification result:", result);
      console.log("Verification result.user:", JSON.stringify(result.user, null, 2));

      if (result.success && result.user) {
        // Session cookie is set server-side by /api/auth/verify-otp
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
    <div className="flex min-h-svh flex-col items-center justify-center bg-background md:bg-muted/40 p-0 md:p-10">
      <div className="w-full max-w-4xl md:mx-auto z-10">
        <Card className="overflow-hidden border-0 shadow-none md:border md:shadow-xl rounded-none md:rounded-xl bg-background">
          <CardContent className="grid p-0 md:grid-cols-2 min-h-[100svh] md:min-h-[600px]">
            {/* Desktop Image Section */}
            <div className="bg-muted relative hidden md:block">
              <img
                src="https://images.pexels.com/photos/34862508/pexels-photo-34862508.jpeg"
                alt="Hospital Interior"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.6] dark:grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-10 text-white">
                <h3 className="text-2xl font-bold mb-2">Modern Healthcare</h3>
                <p className="text-white/90">Experience the future of medical appointment scheduling.</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="flex flex-col justify-center h-full">
               <form
                className="flex flex-col h-full md:h-auto justify-between md:justify-center p-6 sm:p-10 md:p-12"
                onSubmit={
                  step === "xnumber" ? handleXNumberSubmit : handleOtpSubmit
                }
              >
                {/* Header / Logo */}
                <div className="flex flex-col items-center text-center mt-8 md:mt-0 space-y-2">
                  <div className="mb-2 md:mb-6 p-3">
                    <img
                      src="/agahflogo.svg"
                      alt="AGAHF Logo"
                      className="h-32 w-32 md:h-10 md:w-10 object-contain dark:hidden"
                    />
                    <img
                      src="/agahflogo white.svg"
                      alt="AGAHF Logo"
                      className="h-32 w-32 md:h-10 md:w-10 object-contain hidden dark:block"
                    />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {step === "xnumber" ? "Welcome Back" : "Security Verification"}
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base max-w-xs mx-auto">
                    {step === "xnumber"
                      ? "Enter your X-Number to access your portal"
                      : `Enter the code sent to ${xNumber}`}
                  </p>
                </div>

{/* Main Content Area */}
                <div className="flex-1 flex flex-col justify-center py-8 space-y-6 max-w-sm mx-auto w-full">
                  {timeoutMessage && (
                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700 dark:text-amber-400">
                        {timeoutMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {step === "xnumber" ? (
                    <div className="space-y-4 animate-in ease-out duration-300 fade-in slide-in-from-bottom-4">
                      <div className="space-y-2">
                        <Label htmlFor="xnumber" className="sr-only">X-Number</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="xnumber"
                            type="text"
                            placeholder="X12345/67"
                            value={xNumber}
                            onChange={handleXNumberChange}
                            maxLength={10}
                            className="pl-10 h-12 text-lg bg-muted/30 border-muted-foreground/20 focus-visible:border-primary"
                            required
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-medium transition-transform active:scale-[0.98]"
                        disabled={loading}
                      >
                         {loading ? (
                           <div className="flex items-center gap-2">
                             <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                             Processing...
                           </div>
                         ) : "Continue"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in ease-out duration-300 fade-in slide-in-from-right-8">
                       <div className="flex justify-center my-4">
                        <InputOTP
                          maxLength={6}
                          value={otp}
                          onChange={handleOtpChange}
                          disabled={loading}
                          autoFocus
                        >
                          <InputOTPGroup className="gap-2 sm:gap-2">
                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                              <InputOTPSlot 
                                key={idx} 
                                index={idx} 
                                className="h-14 w-12 sm:h-12 sm:w-10 text-2xl sm:text-xl font-semibold border-muted-foreground/20 bg-muted/30 focus-visible:ring-primary focus-visible:border-primary rounded-lg" 
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      
                      {isMockMode && mockOtp && (
                        <div className="mx-auto max-w-xs p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-lg text-center">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Development Code</p>
                          <p className="text-xl font-mono font-bold tracking-widest text-blue-700 dark:text-blue-300">{mockOtp}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-medium transition-transform active:scale-[0.98]"
                        disabled={loading || otp.length !== 6}
                      >
                         {loading ? "Verifying..." : "Verify Login"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Footer Area */}
                <div className="space-y-6 mb-4">
                  {step === "xnumber" ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        type="button"
                        className="w-full h-11 text-muted-foreground hover:text-foreground"
                        asChild
                      >
                        <Link href="/staff-login">I am a Staff Member</Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => {
                        setStep("xnumber");
                        setMockOtp("");
                        setOtp("");
                      }}
                    >
                      Use a different X-Number
                    </Button>
                  )}
                  
                   <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                         Protected by secure OTP verification. <br/>
                         <PrivacyPolicyDialog triggerClassName="text-xs text-green-600/80 hover:underline" /> &bull; <HelpCenterDialog triggerClassName="text-xs text-green-600/80 hover:underline" />
                      </p>
                   </div>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
