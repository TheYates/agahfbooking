"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar as CalendarIcon,
  Eye,
  EyeOff,
  Shield,
  Users,
  CheckCircle,
  Clock,
  Layout,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types for Calendar Configuration
type VisibilityLevel = "own_only" | "all_appointments";
type ViewMode = "agenda" | "week" | "month";

interface CalendarPreset {
  id: string;
  name: string;
  visibility: VisibilityLevel;
  icon: any;
  description: string;
  features: string[];
  recommended?: boolean;
}

const PRESETS: CalendarPreset[] = [
  {
    id: "privacy-mode",
    name: "Privacy First",
    visibility: "own_only",
    icon: Shield,
    description: "Maximum privacy protection. Clients only see their own appointments.",
    features: [
      "Clients see own bookings only",
      "Slots appear as 'Busy' to others",
      "HIPAA Compliant",
      "Zero data leakage risk"
    ],
    recommended: true,
  },
  {
    id: "transparency-mode",
    name: "Open Schedule",
    visibility: "all_appointments",
    icon: Users,
    description: "Transparency focused. Clients can see who else is booked.",
    features: [
      "Clients see all confirmed bookings",
      "Useful for team coordination",
      "May encourage booking",
      "Requires privacy disclaimer"
    ]
  }
];

export function CalendarManagementTab() {
  const calendarSettings = useQuery(api.queries.getCalendarSettings, {});
  const updateSetting = useMutation(api.mutations.updateCalendarSetting);

  const [isUpdating, setIsUpdating] = useState(false);

  // Derive current state from settings
  const currentVisibility = useMemo(() => {
    if (!calendarSettings) return "own_only";
    const setting = calendarSettings.find((s: any) => s.config_key === "client_visibility");
    return (setting?.config_value as VisibilityLevel) || "own_only";
  }, [calendarSettings]);

  const currentViewMode = useMemo(() => {
    if (!calendarSettings) return "week";
    const setting = calendarSettings.find((s: any) => s.config_key === "default_view");
    return (setting?.config_value as ViewMode) || "week";
  }, [calendarSettings]);

  const handleUpdateVisibility = async (visibility: VisibilityLevel) => {
    setIsUpdating(true);
    try {
      await updateSetting({
        config_key: "client_visibility",
        config_value: visibility,
        description: "Controls what clients can see on the calendar",
      });
      toast.success("Calendar visibility updated");
    } catch (error) {
      toast.error("Failed to update visibility");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleUpdateViewMode = async (mode: ViewMode) => {
    setIsUpdating(true);
    try {
      await updateSetting({
        config_key: "default_view",
        config_value: mode,
        description: "Default calendar view for new users",
      });
      toast.success("Default view updated");
    } catch (error) {
      toast.error("Failed to update view mode");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (calendarSettings === undefined) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-12 h-full">
      {/* Left Panel: Configuration */}
      <div className="md:col-span-7 space-y-6">
        <div className="space-y-1">
           <h2 className="text-2xl font-bold tracking-tight">Calendar Experience</h2>
           <p className="text-muted-foreground">Customize how the scheduling calendar appears to your clients.</p>
        </div>

        {/* Visibility Card */}
        <Card className="border-l-4 border-l-primary shadow-sm">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Eye className="h-5 w-5 text-primary" />
               Client Visibility
             </CardTitle>
             <CardDescription>
               Decide what information is exposed on the public booking calendar.
             </CardDescription>
           </CardHeader>
           <CardContent className="grid gap-4">
              {PRESETS.map((preset) => {
                 const isActive = currentVisibility === preset.visibility;
                 const Icon = preset.icon;
                 
                 return (
                   <div 
                      key={preset.id}
                      className={cn(
                        "relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-muted/50",
                        isActive ? "border-primary bg-primary/5" : "border-muted"
                      )}
                      onClick={() => handleUpdateVisibility(preset.visibility)}
                   >
                      <div className={cn(
                        "p-3 rounded-lg flex items-center justify-center",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                         <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground">{preset.name}</h4>
                            {isActive && <CheckCircle className="h-5 w-5 text-primary" />}
                         </div>
                         <p className="text-sm text-muted-foreground">{preset.description}</p>
                         
                         <div className="flex flex-wrap gap-2 mt-2 pt-2">
                            {preset.features.map((feature, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-normal">
                                {feature}
                              </Badge>
                            ))}
                         </div>
                      </div>
                      
                      {preset.recommended && (
                         <div className="absolute top-0 right-0 -mt-2 -mr-2">
                            <Badge className="bg-green-600 hover:bg-green-700">Recommended</Badge>
                         </div>
                      )}
                   </div>
                 );
              })}
           </CardContent>
        </Card>

        {/* Default View Setting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Default View
            </CardTitle>
            <CardDescription>
              Set the initial calendar view mode for new visitors.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-3 gap-3">
               {[
                 { id: "week", label: "Week View", icon: CalendarIcon },
                 { id: "month", label: "Month View", icon: CalendarIcon },
                 { id: "agenda", label: "Agenda", icon: Clock },
               ].map((mode) => (
                  <Button
                    key={mode.id}
                    variant={currentViewMode === mode.id ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={() => handleUpdateViewMode(mode.id as ViewMode)}
                  >
                    <mode.icon className="h-5 w-5" />
                    <span>{mode.label}</span>
                  </Button>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Preview Area */}
      <div className="md:col-span-5">
        <div className="sticky top-6 space-y-4">
           <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Preview
           </h3>
           
           <Card className="overflow-hidden border-2 border-dashed shadow-none bg-muted/20">
              <div className="bg-background border-b p-3 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                 </div>
                 <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                    calendar.hospital.com
                 </div>
              </div>
              
              <div className="p-6 space-y-6">
                 {/* Mock Calendar Header */}
                 <div className="flex justify-between items-center mb-6">
                    <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                    <div className="flex gap-2">
                       <div className="h-8 w-8 bg-muted rounded" />
                       <div className="h-8 w-8 bg-muted rounded" />
                    </div>
                 </div>
                 
                 {/* Mock Calendar Grid */}
                 <div className="space-y-2">
                    {[9, 10, 11].map((hour) => (
                       <div key={hour} className="flex gap-4 items-start">
                          <span className="text-xs text-muted-foreground w-12 pt-1">{hour}:00</span>
                          <div className="flex-1 h-16 border rounded bg-background p-2 relative">
                             {/* Simulation of an appointment */}
                             {currentVisibility === "all_appointments" ? (
                                <div className="absolute top-2 left-2 right-2 bottom-2 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded p-2 text-xs">
                                   <div className="font-semibold text-blue-700 dark:text-blue-300">Booked: John D.</div>
                                   <div className="text-blue-600/70 dark:text-blue-400/70 flex items-center gap-1 mt-1">
                                      <Globe className="h-3 w-3" /> Dr. Smith
                                   </div>
                                </div>
                             ) : (
                                <div className="absolute top-2 left-2 right-2 bottom-2 bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-400 rounded p-2 text-xs flex items-center justify-center text-muted-foreground">
                                   <div className="flex items-center gap-2">
                                      <Lock className="h-3 w-3" />
                                      <span>Busy / Reserved</span>
                                   </div>
                                </div>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="bg-muted/50 p-4 border-t text-center">
                 <p className="text-xs text-muted-foreground">
                    This is how a booked slot will appear to a <strong>logged-out</strong> visitor.
                 </p>
              </div>
           </Card>
           
           <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                 Settings update in real-time. No save button needed.
              </AlertDescription>
           </Alert>
        </div>
      </div>
    </div>
  );
}
