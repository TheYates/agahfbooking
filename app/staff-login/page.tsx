"use client";

// This component is BetterAuth-ready and uses the updated API endpoints
import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
              <form className="p-8 md:p-12" onSubmit={handleUsernameLogin}>
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
                    <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                      <Shield className="h-6 w-6" />
                      Staff Login
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      Access the hospital appointment system
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-3">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
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
                    onClick={() => router.push("/login")}
                  >
                    Patient Login
                  </Button>

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
