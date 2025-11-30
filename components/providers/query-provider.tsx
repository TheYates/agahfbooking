"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode, useEffect } from "react";

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient instance inside component to avoid SSR issues
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🚀 NEAR-INSTANTANEOUS: Aggressive caching settings
            staleTime: 30 * 1000, // 30 seconds - show cached data instantly
            gcTime: 10 * 60 * 1000, // 10 minutes garbage collection

            // Fast retries
            retry: 1, // Only 1 retry (faster failure)
            retryDelay: 300, // 300ms retry delay (vs default 1000+)

            // Performance optimizations
            refetchOnWindowFocus: false, // Don't refetch on tab focus (annoying)
            refetchOnReconnect: true, // Do refetch when back online
            refetchOnMount: true, // Check for fresh data

            // Network mode: prefer cached data
            networkMode: "online", // Fetch fresh data for param changes
          },
          mutations: {
            retry: 0, // No retries for mutations (faster feedback)
            networkMode: "online",
          },
        },
      })
  );

  // 🔥 Prefetch common data on mount for instant access
  useEffect(() => {
    // Prefetch departments (rarely changes, used everywhere)
    queryClient.prefetchQuery({
      queryKey: ["departments"],
      queryFn: async () => {
        const res = await fetch("/api/departments");
        return res.json();
      },
      staleTime: 5 * 60 * 1000, // Departments are stable for 5 minutes
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
