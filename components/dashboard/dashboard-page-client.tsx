// @ts-nocheck
"use client";

import { useState } from "react";
import { DashboardClient } from "@/components/dashboard-client";
import { MobileDashboardClient } from "@/components/dashboard/mobile-dashboard-client";
import { useBooking } from "@/components/mobile-layout";
import type { User } from "@/lib/types";

interface DashboardPageClientProps {
  user: User;
}

export function DashboardPageClient({ user }: DashboardPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Get booking function from context (only available on mobile within MobileLayout)
  let openBooking: ((departmentId?: string) => void) | undefined;
  try {
    const booking = useBooking();
    openBooking = booking.openBooking;
  } catch {
    // Not within MobileLayout context (e.g., on desktop), ignore
  }

  const handleBookingClick = (departmentId?: string) => {
    // Call the booking function from MobileLayout context if available
    openBooking?.(departmentId);
    // Also trigger a refresh of dashboard data
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Desktop Dashboard - Using Supabase/API */}
      <div className="hidden md:block">
        <DashboardClient user={user} />
      </div>

      {/* Mobile Dashboard - Using Supabase/API */}
      <div className="md:hidden">
        <MobileDashboardClient
          key={refreshKey}
          user={user}
          onBookingClick={handleBookingClick}
        />
      </div>
    </div>
  );
}
