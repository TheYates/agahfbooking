"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { 
  Settings, 
  Shield, 
  Bell, 
  Save, 
  Globe, 
  Lock, 
  Mail, 
  MessageSquare,
  CheckCircle2 
} from "lucide-react";

export default function SettingsPageConvex() {
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [smsProvider, setSmsProvider] = useState("hubtel");

  // Convex queries
  const systemSettings = useQuery(api.queries.getSystemSettings, {});
  const updateSetting = useMutation(api.mutations.updateSystemSetting);

  const loading = systemSettings === undefined;
  const error = systemSettings === null;

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      await updateSetting({
        setting_key: key,
        setting_value: value,
      });
      toast.success("Setting updated successfully");
    } catch (error) {
      console.error("Error updating setting:", error);
      toast.error("Failed to update setting");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage system configuration and preferences
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="authentication" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Authentication
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <CardTitle>General Settings</CardTitle>
              </div>
              <CardDescription>
                Basic system configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading settings...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <p>Error loading settings</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="system-name">System Name</Label>
                        <Input 
                          id="system-name"
                          defaultValue="Hospital Booking System" 
                          placeholder="Enter system name"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Displayed in the application header
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="language">Default Language</Label>
                        <Input 
                          id="language"
                          defaultValue="English" 
                          placeholder="Select language"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Default language for new users
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>System Status</Label>
                          <p className="text-sm text-muted-foreground">
                            Current operational status
                          </p>
                        </div>
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={() => toast.success("Settings saved successfully!")}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-600" />
                <CardTitle>Authentication Settings</CardTitle>
              </div>
              <CardDescription>
                Configure OTP and authentication methods for client access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable OTP Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow clients to login with one-time password codes sent via SMS
                    </p>
                  </div>
                  <Switch
                    checked={otpEnabled}
                    onCheckedChange={setOtpEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sms-provider">SMS Provider</Label>
                  <Input
                    id="sms-provider"
                    value={smsProvider}
                    onChange={(e) => setSmsProvider(e.target.value)}
                    placeholder="e.g., hubtel, twilio"
                  />
                  <p className="text-xs text-muted-foreground">
                    SMS service provider for sending OTP codes
                  </p>
                </div>

                {otpEnabled && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                          OTP Authentication Enabled
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          Clients will receive a 6-digit code via SMS to verify their identity
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => handleSaveSetting("otp_enabled", String(otpEnabled))}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-600" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>
                Configure appointment reminders and system notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <Label className="text-base">Email Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send appointment reminders and updates via email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <Label className="text-base">SMS Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send appointment reminders and updates via SMS
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 border rounded-lg">
                  <h4 className="font-medium text-sm mb-3">Notification Schedule</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                      <span>24 hours before appointment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-600"></div>
                      <span>2 hours before appointment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-600"></div>
                      <span>On appointment confirmation</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => toast.success("Notification settings saved successfully!")}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
