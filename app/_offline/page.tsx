"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="rounded-full bg-muted p-6">
          <WifiOff className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">You're Offline</h1>
          <p className="text-muted-foreground max-w-sm">
            It looks like you've lost your internet connection. Please check your
            connection and try again.
          </p>
        </div>

        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        <div className="pt-8">
          <img
            src="/agahflogo.svg"
            alt="AGAHF Logo"
            className="h-12 w-auto opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
