"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

interface InactivitySettings {
  enabled: boolean;
  timeoutMinutes: number;
}

const DEFAULT_TIMEOUT_MINUTES = 60;

async function fetchInactivitySettings(): Promise<InactivitySettings> {
  try {
    const response = await fetch("/api/settings/system");
    const data = await response.json();
    if (data.success) {
      return {
        enabled: true,
        timeoutMinutes: data.data?.sessionTimeoutMinutes || DEFAULT_TIMEOUT_MINUTES,
      };
    }
    return { enabled: true, timeoutMinutes: DEFAULT_TIMEOUT_MINUTES };
  } catch {
    return { enabled: true, timeoutMinutes: DEFAULT_TIMEOUT_MINUTES };
  }
}

export function useInactivityTimeout(enabled: boolean = true) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["inactivity-settings"],
    queryFn: fetchInactivitySettings,
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const timeoutMinutes = settings?.timeoutMinutes || DEFAULT_TIMEOUT_MINUTES;

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    
    if (typeof window !== "undefined") {
      const isClient = window.location.pathname.startsWith("/dashboard") && 
        !window.location.pathname.includes("/staff");
      router.push(isClient ? "/login?reason=timeout" : "/staff-login?reason=timeout");
    }
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (!enabled || !settings?.enabled) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - 60000;

    if (warningMs > 0) {
      warningRef.current = setTimeout(() => {
        const event = new CustomEvent("inactivity-warning", {
          detail: { remainingMinutes: 1 },
        });
        window.dispatchEvent(event);
      }, warningMs);
    }

    timeoutRef.current = setTimeout(logout, timeoutMs);
  }, [enabled, settings?.enabled, timeoutMinutes, logout]);

  useEffect(() => {
    if (!enabled) return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [enabled, resetTimer]);

  return { timeoutMinutes };
}
