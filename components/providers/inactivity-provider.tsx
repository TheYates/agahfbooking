"use client";

import { useEffect, useState } from "react";
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

export function InactivityProvider({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);
  const { timeoutMinutes } = useInactivityTimeout(true);

  useEffect(() => {
    const handleWarning = () => {
      setShowWarning(true);
    };

    window.addEventListener("inactivity-warning", handleWarning);
    return () => {
      window.removeEventListener("inactivity-warning", handleWarning);
    };
  }, []);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
  };

  return (
    <>
      {children}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Session Timeout Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out in 1 minute due to inactivity. 
              Click "Stay Logged In" to continue your session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
