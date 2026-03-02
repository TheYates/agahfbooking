"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";

type SessionResponse =
  | { success: true; user: User }
  | { success: false; error: string };

export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
          },
        });

        if (!mounted) return;

        const data = (await res.json()) as SessionResponse;

        if (!res.ok || !data.success) {
          setUser(null);
          setError(!data.success ? data.error : "Failed to load session");
          return;
        }

        setUser(data.user);
      } catch (e) {
        if (!mounted) return;
        setUser(null);
        setError(e instanceof Error ? e.message : "Failed to load session");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { user, isLoading, error };
}
