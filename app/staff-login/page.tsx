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

    <div className="flex min-h-svh flex-col items-center justify-center bg-background md:bg-muted/40 p-0 md:p-10">
      <div className="w-full max-w-4xl md:mx-auto z-10">
        <Card className="overflow-hidden border-0 shadow-none md:border md:shadow-xl rounded-none md:rounded-xl bg-background">
          <CardContent className="grid p-0 md:grid-cols-2 min-h-[100svh] md:min-h-[600px]">
            {/* Desktop Image Section */}
            <div className="bg-muted relative hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=center"
                alt="Hospital Interior"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.6] dark:grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-10 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                  <h3 className="text-2xl font-bold">Staff Portal</h3>
                </div>
                <p className="text-white/90">Secure access for medical professionals and administrators.</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="flex flex-col justify-center h-full">
               <form 
                 className="flex flex-col h-full md:h-auto justify-between md:justify-center p-6 sm:p-10 md:p-12" 
                 onSubmit={handleUsernameLogin}
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
                    Staff Access
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base max-w-xs mx-auto">
                    Please log in with your credentials
                  </p>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col justify-center py-8 space-y-6 max-w-sm mx-auto w-full">
                  {error && (
                    <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-4 animate-in ease-out duration-300 fade-in slide-in-from-bottom-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="sr-only">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Username"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                          }
                          className="h-12 text-lg bg-muted/30 border-muted-foreground/20 focus-visible:border-green-500"
                          required
                          autoComplete="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="sr-only">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="h-12 text-lg bg-muted/30 border-muted-foreground/20 focus-visible:border-green-500"
                          required
                          autoComplete="current-password"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-medium transition-transform active:scale-[0.98] bg-green-600 hover:bg-green-700" 
                      disabled={loading}
                    >
                      {loading ? (
                         <div className="flex items-center gap-2">
                           <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                           Authenticating...
                         </div>
                       ) : "Sign In"}
                    </Button>
                  </div>
                </div>

                {/* Footer Area */}
                <div className="space-y-6 mb-4">
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
                      onClick={() => router.push("/login")}
                    >
                      Return to Patient Login
                    </Button>
                  </div>

                  <div className="text-center">
                     <p className="text-xs text-muted-foreground">
                        Restricted System. Authorized personnel only. <br/>
                        <a href="#" className="hover:underline text-green-600/80">IT Support</a> &bull; <a href="#" className="hover:underline text-green-600/80">Security Policy</a>
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
