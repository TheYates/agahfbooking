"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, CreditCard, Calendar, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    emergencyContact: "",
    address: "",
    medicalNotes: "",
  });

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
      medicalNotes: "No known allergies",
      joinDate: "2024-01-15",
      totalAppointments: 15,
      completedAppointments: 12,
      upcomingAppointments: 2,
    };

    setUser(mockUser);
    setFormData({
      name: mockUser.name,
      phone: mockUser.phone,
      emergencyContact: mockUser.emergencyContact || "",
      address: mockUser.address || "",
      medicalNotes: mockUser.medicalNotes || "",
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update user data
      setUser((prev: any) => ({ ...prev, ...formData }));
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">X-Number</Label>
                <div className="text-sm font-mono bg-muted text-foreground p-3 rounded-md border">
                  {user.xNumber}
                </div>
              </div>
              <div>
                <Label className="text-foreground">Category</Label>
                <Badge variant="secondary" className="mt-2">
                  {user.category}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="name" className="text-foreground">
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              ) : (
                <div className="text-sm p-3 border rounded-md bg-muted/50 text-foreground mt-2">
                  {user.name}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="text-foreground">
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              ) : (
                <div className="text-sm p-3 border rounded-md bg-muted/50 text-foreground mt-2">
                  {user.phone}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="emergency" className="text-foreground">
                Emergency Contact
              </Label>
              {isEditing ? (
                <Input
                  id="emergency"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: e.target.value,
                    })
                  }
                  placeholder="Emergency contact phone number"
                />
              ) : (
                <div className="text-sm p-3 border rounded-md bg-muted/50 text-foreground mt-2">
                  {user.emergencyContact || "Not provided"}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="address" className="text-foreground">
                Address
              </Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Your address"
                  rows={2}
                />
              ) : (
                <div className="text-sm p-3 border rounded-md bg-muted/50 text-foreground mt-2">
                  {user.address || "Not provided"}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Medical Information
            </CardTitle>
            <CardDescription>Medical notes and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="medical" className="text-foreground">
                Medical Notes
              </Label>
              {isEditing ? (
                <Textarea
                  id="medical"
                  value={formData.medicalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, medicalNotes: e.target.value })
                  }
                  placeholder="Allergies, medical conditions, medications, etc."
                  rows={4}
                />
              ) : (
                <div className="text-sm p-3 border rounded-md bg-muted/50 text-foreground min-h-[120px] mt-2">
                  {user.medicalNotes || "No medical notes"}
                </div>
              )}
            </div>

            <div>
              <Label className="text-foreground">Member Since</Label>
              <div className="text-sm p-3 border rounded-md bg-muted/50 text-foreground mt-2">
                {new Date(user.joinDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment Statistics
          </CardTitle>
          <CardDescription>
            Your appointment history and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-6 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {user.totalAppointments}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Total Appointments
              </div>
            </div>
            <div className="text-center p-6 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {user.completedAppointments}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Completed
              </div>
            </div>
            <div className="text-center p-6 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {user.upcomingAppointments}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Upcoming</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
