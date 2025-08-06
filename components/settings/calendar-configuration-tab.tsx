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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Note: RadioGroup component may need to be installed or created
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Eye,
  EyeOff,
  Shield,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

interface CalendarConfig {
  clientVisibility: "own_only" | "all_appointments";
  description: string;
}

interface CalendarStatus {
  currentVisibility: "own_only" | "all_appointments";
  description: string;
  isDefault: boolean;
}

interface VisibilityOption {
  value: "own_only" | "all_appointments";
  label: string;
  description: string;
  recommended?: boolean;
}

export function CalendarConfigurationTab() {
  const [config, setConfig] = useState<CalendarConfig | null>(null);
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [options, setOptions] = useState<VisibilityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch current configuration
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/settings/calendar-config");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch calendar configuration");
      }

      setConfig(data.data.config);
      setStatus(data.data.status);
      setOptions(data.data.options);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch configuration"
      );
    } finally {
      setLoading(false);
    }
  };

  // Update visibility setting
  const updateVisibility = async (
    newVisibility: "own_only" | "all_appointments"
  ) => {
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings/calendar-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Admin authentication required. Please log in as an administrator."
          );
        }
        throw new Error(
          data.error || "Failed to update calendar configuration"
        );
      }

      setConfig(data.data.config);
      setStatus(data.data.status);
      setSuccess("Calendar configuration updated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update configuration"
      );
    } finally {
      setUpdating(false);
    }
  };

  // Reset to default
  const resetToDefault = async () => {
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings/calendar-config", {
        method: "PUT",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset calendar configuration");
      }

      setConfig(data.data.config);
      setStatus(data.data.status);
      setSuccess("Calendar configuration reset to default!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset configuration"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading calendar configuration...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Visibility Settings
          </CardTitle>
          <CardDescription>
            Control what appointments clients can see in their calendar view
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Current Setting</h4>
                {status.isDefault && <Badge variant="secondary">Default</Badge>}
              </div>
              <div className="flex items-center gap-2 mb-2">
                {status.currentVisibility === "own_only" ? (
                  <EyeOff className="h-4 w-4 text-green-600" />
                ) : (
                  <Eye className="h-4 w-4 text-blue-600" />
                )}
                <span className="font-medium">
                  {status.currentVisibility === "own_only"
                    ? "Own Appointments Only"
                    : "All Appointments"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {status.description}
              </p>
            </div>
          )}

          {/* Configuration Options */}
          {config && options.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Choose Visibility Setting
              </Label>
              <div className="space-y-3">
                {options.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      config.clientVisibility === option.value
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start h-auto p-4"
                    onClick={() => updateVisibility(option.value)}
                    disabled={updating}
                  >
                    <div className="flex items-start gap-3 text-left">
                      {option.value === "own_only" ? (
                        <EyeOff className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{option.label}</span>
                          {option.recommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => fetchConfig()}
              variant="outline"
              disabled={updating}
            >
              Refresh
            </Button>
            {status && !status.isDefault && (
              <Button
                onClick={resetToDefault}
                variant="outline"
                disabled={updating}
              >
                {updating ? "Resetting..." : "Reset to Default"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How This Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Own Appointments Only</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clients see only their own appointments</li>
                <li>• Maximum privacy protection</li>
                <li>• HIPAA compliant</li>
                <li>• Recommended for most hospitals</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">All Appointments</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clients can see all appointments</li>
                <li>• Useful for coordination</li>
                <li>• May help with scheduling</li>
                <li>• Consider privacy implications</li>
              </ul>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Staff members (receptionists and admins)
              always see all appointments regardless of this setting. This
              setting only affects what clients can see.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
