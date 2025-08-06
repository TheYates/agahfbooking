"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Mock user data - in real app, fetch from API
    const mockUser = {
      id: 1,
      xNumber: "X12345/67",
      name: "John Doe",
      phone: "+1234567890",
      category: "PRIVATE CASH",
      role: "client",
      emergencyContact: "+1234567891",
      address: "123 Main St, City, State 12345",
      joinDate: "2024-01-15",
    };

    setUser(mockUser);
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">View your personal information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-foreground">X-Number</Label>
                <div className="text-sm font-mono bg-muted text-foreground p-3 rounded-md border mt-2">
                  {user.xNumber}
                </div>
              </div>
              <div>
                <Label htmlFor="category" className="text-foreground">
                  Category
                </Label>
                <Input
                  id="category"
                  value={user.category}
                  readOnly
                  className="mt-2 bg-muted/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={user.name}
                  readOnly
                  className="mt-2 bg-muted/50"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-foreground">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={user.phone}
                  readOnly
                  className="mt-2 bg-muted/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="emergency" className="text-foreground">
                  Emergency Contact
                </Label>
                <Input
                  id="emergency"
                  value={user.emergencyContact || "Not provided"}
                  readOnly
                  className="mt-2 bg-muted/50"
                />
              </div>
              <div>
                <Label className="text-foreground">Member Since</Label>
                <Input
                  value={new Date(user.joinDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  readOnly
                  className="mt-2 bg-muted/50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-foreground">
                Address
              </Label>
              <Input
                id="address"
                value={user.address || "Not provided"}
                readOnly
                className="mt-2 bg-muted/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Account details and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground">Account Type</Label>
              <div className="text-sm p-3 border rounded-md bg-muted/50 text-foreground mt-2">
                Client Account
              </div>
            </div>

            <div>
              <Label className="text-foreground">Status</Label>
              <div className="text-sm p-3 border rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 mt-2">
                Active
              </div>
            </div>

            <div>
              <Label className="text-foreground">Last Login</Label>
              <div className="text-sm p-3 border rounded-md bg-muted/50 text-foreground mt-2">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                To update your profile information, please contact the reception
                desk or call the hospital directly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
