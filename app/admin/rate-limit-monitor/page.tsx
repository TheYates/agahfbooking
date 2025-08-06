"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RateLimitStats {
  totalAttempts: number;
  failedAttempts: number;
  blockedIPs: number;
  suspiciousIPs: number;
  uniqueIPs: number;
}

interface RateLimitConfig {
  maxAttemptsPerIP: number;
  maxAttemptsPerXNumber: number;
  timeWindowMinutes: number;
  captchaThreshold: number;
  blockThreshold: number;
  blockDurationMinutes: number;
}

export default function RateLimitMonitorPage() {
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [config, setConfig] = useState<RateLimitConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetIP, setResetIP] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/admin/rate-limit-stats");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch stats");
      }
      
      setStats(data.statistics);
      setConfig(data.configuration);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  const resetIPLimits = async () => {
    if (!resetIP.trim()) {
      setError("Please enter an IP address to reset");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch("/api/admin/rate-limit-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reset_ip",
          ip: resetIP.trim()
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset IP");
      }
      
      setSuccess(data.message);
      setResetIP("");
      
      // Refresh stats
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset IP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rate Limiting Monitor</h1>
        <Button onClick={fetchStats} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        {stats && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalAttempts}</div>
                <p className="text-muted-foreground">All login attempts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failed Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.failedAttempts}</div>
                <p className="text-muted-foreground">Unsuccessful attempts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blocked IPs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats.blockedIPs}</div>
                <p className="text-muted-foreground">Currently blocked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suspicious IPs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.suspiciousIPs}</div>
                <p className="text-muted-foreground">Flagged as suspicious</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unique IPs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.uniqueIPs}</div>
                <p className="text-muted-foreground">Different IP addresses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.totalAttempts > 0 
                    ? Math.round(((stats.totalAttempts - stats.failedAttempts) / stats.totalAttempts) * 100)
                    : 100}%
                </div>
                <p className="text-muted-foreground">Successful attempts</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Configuration Display */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Max Attempts per IP:</strong> {config.maxAttemptsPerIP}
              </div>
              <div>
                <strong>Max Attempts per X-Number:</strong> {config.maxAttemptsPerXNumber}
              </div>
              <div>
                <strong>Time Window:</strong> {config.timeWindowMinutes} minutes
              </div>
              <div>
                <strong>CAPTCHA Threshold:</strong> {config.captchaThreshold}
              </div>
              <div>
                <strong>Block Threshold:</strong> {config.blockThreshold}
              </div>
              <div>
                <strong>Block Duration:</strong> {config.blockDurationMinutes} minutes
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="resetIP">Reset IP Address</Label>
              <Input
                id="resetIP"
                placeholder="Enter IP address (e.g., 192.168.1.100)"
                value={resetIP}
                onChange={(e) => setResetIP(e.target.value)}
              />
            </div>
            <Button onClick={resetIPLimits} disabled={loading || !resetIP.trim()}>
              Reset IP
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Note:</strong> This page is for monitoring and debugging purposes.</p>
            <p>Use the reset function carefully to unblock legitimate users.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
