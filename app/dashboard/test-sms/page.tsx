"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SMSConfig {
  configured: boolean;
  clientId: string;
  senderId: string;
  message: string;
}

export default function TestSMSPage() {
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Test message from AGAHF Hospital booking system. If you receive this, SMS integration is working correctly.");

  // Fetch SMS configuration status
  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/test-sms");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching SMS config:", error);
      toast.error("Failed to check SMS configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Send test SMS
  const handleSendTest = async () => {
    if (!phone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/test-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
          message: message.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Test SMS sent successfully!");
      } else {
        toast.error(`Failed to send SMS: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error("Error sending test SMS:", error);
      toast.error("Failed to send test SMS");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading SMS configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Testing</h1>
          <p className="text-muted-foreground">
            Test Hubtel SMS integration and configuration
          </p>
        </div>
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {config?.configured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span>Hubtel SMS Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge variant={config?.configured ? "default" : "destructive"}>
              {config?.configured ? "Configured" : "Not Configured"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Client ID:</span>
            <span className="text-sm text-muted-foreground">{config?.clientId}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Sender ID:</span>
            <span className="text-sm text-muted-foreground">{config?.senderId}</span>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">{config?.message}</p>
          </div>

          {!config?.configured && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Configuration Required</p>
                <p>Please update your .env.local file with valid Hubtel credentials:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>HUBTEL_CLIENT_ID</li>
                  <li>HUBTEL_CLIENT_SECRET</li>
                  <li>HUBTEL_SENDER_ID</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test SMS Form */}
      {config?.configured && (
        <Card>
          <CardHeader>
            <CardTitle>Send Test SMS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., +233240123456 or 0240123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a Ghana phone number (with or without country code)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your test message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Maximum 160 characters for single SMS
              </p>
            </div>

            <Button 
              onClick={handleSendTest} 
              disabled={sending || !phone.trim()}
              className="w-full"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test SMS
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">1. Configure Hubtel Credentials</h4>
            <p className="text-sm text-muted-foreground">
              Update your .env.local file with valid Hubtel API credentials from your Hubtel dashboard.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Test SMS Sending</h4>
            <p className="text-sm text-muted-foreground">
              Enter a valid Ghana phone number and send a test message to verify the integration.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. OTP Integration</h4>
            <p className="text-sm text-muted-foreground">
              Once SMS is working, OTP codes will be automatically sent to clients during login.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
