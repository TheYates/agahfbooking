"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  Gavel,
  History,
  Lock,
  UserX,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export function AntiAbuseManagementTab() {
  const systemSettings = useQuery(api.queries.getSystemSettings, {});
  const updateSetting = useMutation(api.mutations.updateSystemSetting);

  const [loading, setLoading] = useState(false);
  
  // Local state for immediate UI feedback
  const [limits, setLimits] = useState({
    maxBookingsPerDay: 3,
    maxPendingAppointments: 2,
    minTimeBetweenBookings: 60, // minutes
  });
  
  const [penalties, setPenalties] = useState({
    enabled: true,
    duration: 7, // days
    threshold: 2, // no-shows before penalty
  });

  const [blacklisting, setBlacklisting] = useState({
    autoBlacklist: false,
    manualReview: true,
  });

  // Sync with backend data when loaded
  useEffect(() => {
    if (systemSettings) {
      const getVal = (key: string, def: any) => {
        const setting = systemSettings.find((s: any) => s.setting_key === key);
        return setting ? setting.setting_value : def;
      };

      setLimits({
        maxBookingsPerDay: parseInt(getVal("max_bookings_per_day", "3")),
        maxPendingAppointments: parseInt(getVal("max_pending_appointments", "2")),
        minTimeBetweenBookings: parseInt(getVal("min_time_between_bookings", "60")),
      });

      setPenalties({
        enabled: getVal("penalty_enabled", "true") === "true",
        duration: parseInt(getVal("penalty_duration_days", "7")),
        threshold: parseInt(getVal("penalty_threshold", "2")),
      });
      
      setBlacklisting({
        autoBlacklist: getVal("auto_blacklist", "false") === "true",
        manualReview: getVal("manual_review", "true") === "true",
      });
    }
  }, [systemSettings]);

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Save Limits
      await updateSetting({ setting_key: "max_bookings_per_day", setting_value: String(limits.maxBookingsPerDay) });
      await updateSetting({ setting_key: "max_pending_appointments", setting_value: String(limits.maxPendingAppointments) });
      await updateSetting({ setting_key: "min_time_between_bookings", setting_value: String(limits.minTimeBetweenBookings) });

      // Save Penalties
      await updateSetting({ setting_key: "penalty_enabled", setting_value: String(penalties.enabled) });
      await updateSetting({ setting_key: "penalty_duration_days", setting_value: String(penalties.duration) });
      await updateSetting({ setting_key: "penalty_threshold", setting_value: String(penalties.threshold) });
      
      // Save Blacklisting
      await updateSetting({ setting_key: "auto_blacklist", setting_value: String(blacklisting.autoBlacklist) });
      await updateSetting({ setting_key: "manual_review", setting_value: String(blacklisting.manualReview) });

      toast.success("Anti-abuse configuration saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-12">
      {/* Left Column: Configuration */}
      <div className="md:col-span-8 space-y-6">
        
        {/* Rate Limiting Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Booking Rate Limits</CardTitle>
            </div>
            <CardDescription>
              Control how frequently clients can book appointments to prevent spam.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Max Bookings Per Day</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={limits.maxBookingsPerDay}
                    onChange={(e) => setLimits({...limits, maxBookingsPerDay: parseInt(e.target.value) || 1})}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">per client</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Max Pending Appointments</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="1" 
                    max="5"
                    value={limits.maxPendingAppointments}
                    onChange={(e) => setLimits({...limits, maxPendingAppointments: parseInt(e.target.value) || 1})}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">concurrently</span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
               <Label>Minimum Time Between Bookings</Label>
               <div className="flex items-center gap-4 mt-2">
                  {[30, 60, 120].map((mins) => (
                    <div 
                      key={mins}
                      onClick={() => setLimits({...limits, minTimeBetweenBookings: mins})}
                      className={cn(
                        "cursor-pointer px-4 py-2 rounded-md border text-sm font-medium transition-colors",
                        limits.minTimeBetweenBookings === mins 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      {mins} mins
                    </div>
                  ))}
                  <div className="flex items-center gap-2 flex-1 relative">
                     <Input 
                        type="number"
                        className="w-20"
                        value={limits.minTimeBetweenBookings}
                        onChange={(e) => setLimits({...limits, minTimeBetweenBookings: parseInt(e.target.value) || 0})}
                     />
                     <span className="text-sm text-muted-foreground">custom</span>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Penalty System Section */}
        <Card className={cn("transition-all", !penalties.enabled && "opacity-75 bg-muted/30")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-orange-600" />
                <CardTitle>Automatic Penalty System</CardTitle>
              </div>
              <Switch 
                checked={penalties.enabled}
                onCheckedChange={(c) => setPenalties({...penalties, enabled: c})}
              />
            </div>
            <CardDescription>
              Automatically restrict accounts based on "No-Show" behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg flex gap-4">
              <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-orange-900 dark:text-orange-100">Penalty Logic</h4>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  If a client accumulates <strong>{penalties.threshold} no-shows</strong>, 
                  they will be blocked from booking new appointments for <strong>{penalties.duration} days</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ pointerEvents: penalties.enabled ? 'auto' : 'none' }}>
              <div className="space-y-3">
                 <Label>No-Show Threshold</Label>
                 <div className="flex items-center gap-3">
                    <Input 
                        type="number" 
                        min="1" 
                        max="5"
                        value={penalties.threshold}
                        onChange={(e) => setPenalties({...penalties, threshold: parseInt(e.target.value) || 1})}
                    />
                    <div className="text-sm text-muted-foreground">missed appointments</div>
                 </div>
              </div>
              
              <div className="space-y-3">
                 <Label>Ban Duration</Label>
                 <div className="flex items-center gap-3">
                    <Input 
                        type="number" 
                        min="1" 
                        max="365"
                        value={penalties.duration}
                        onChange={(e) => setPenalties({...penalties, duration: parseInt(e.target.value) || 1})}
                    />
                    <div className="text-sm text-muted-foreground">days blocked</div>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blacklist & Security */}
        <Card>
           <CardHeader>
              <div className="flex items-center gap-2">
                 <UserX className="h-5 w-5 text-red-600" />
                 <CardTitle>Advanced Security</CardTitle>
              </div>
              <CardDescription>Hard blocking and manual review settings.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                 <div className="space-y-0.5">
                    <div className="font-medium">Permanent Auto-Blacklist</div>
                    <div className="text-sm text-muted-foreground">Permanently ban users after repeated penalties (Recommended: Off)</div>
                 </div>
                 <Switch 
                    checked={blacklisting.autoBlacklist} 
                    onCheckedChange={(c) => setBlacklisting({...blacklisting, autoBlacklist: c})}
                 />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                 <div className="space-y-0.5">
                    <div className="font-medium">Flag for Manual Review</div>
                    <div className="text-sm text-muted-foreground">Notify admins instead of auto-banning for edge cases</div>
                 </div>
                 <Switch 
                    checked={blacklisting.manualReview}
                    onCheckedChange={(c) => setBlacklisting({...blacklisting, manualReview: c})}
                 />
              </div>
           </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
           <Button onClick={handleSaveAll} disabled={loading} size="lg" className="px-8">
             {loading ? "Saving Changes..." : "Save Configuration"}
           </Button>
        </div>

      </div>

      {/* Right Column: Status & Preview */}
      <div className="md:col-span-4 space-y-6">
         {/* Status Card */}
         <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
            <CardHeader className="pb-2">
               <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  System Status
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Protection Level:</span>
                     <span className="font-medium text-green-700 dark:text-green-400">High</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Active Bans:</span>
                     <span className="font-medium">0 Users</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Flagged Users:</span>
                     <span className="font-medium">0 Users</span>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Simulation / Info */}
         <Card>
            <CardHeader>
               <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How it works
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
               <p>
                  The anti-abuse system runs on every booking attempt.
                  It checks the user's history, current pending bookings, and penalty status.
               </p>
               <div className="border-l-2 pl-4 py-1 space-y-2">
                  <p>
                     <strong className="text-foreground">1. Rate Check:</strong> Is the user booking too fast?
                  </p>
                  <p>
                     <strong className="text-foreground">2. Limit Check:</strong> Have they exceeded daily limits?
                  </p>
                  <p>
                     <strong className="text-foreground">3. Status Check:</strong> Are they currently serving a penalty ban?
                  </p>
               </div>
            </CardContent>
         </Card>
         
         <Card>
            <CardHeader>
               <CardTitle className="text-base text-red-600 flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4" />
                  Emergency Override
               </CardTitle>
               <CardDescription>
                  Lift all active automated bans immediately.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <Button variant="destructive" className="w-full" size="sm">
                  Reset All Penalties
               </Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
