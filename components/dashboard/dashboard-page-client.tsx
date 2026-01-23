"use client";

import { useState } from "react";
import { DashboardClientConvex } from "@/components/dashboard/dashboard-client-convex";
import { MobileDashboardClientConvex } from "@/components/dashboard/mobile-dashboard-client-convex";
import { useBooking } from "@/components/mobile-layout";
import type { User } from "@/lib/types";

interface DashboardPageClientProps {
  user: User;
}

export function DashboardPageClient({ user }: DashboardPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Get booking function from context (only available on mobile within MobileLayout)
  let openBooking: ((departmentId?: number) => void) | undefined;
  try {
    const booking = useBooking();
    openBooking = booking.openBooking;
  } catch {
    // Not within MobileLayout context (e.g., on desktop), ignore
  }

  const handleBookingClick = (departmentId?: number) => {
    // Call the booking function from MobileLayout context if available
    openBooking?.(departmentId);
    // Also trigger a refresh of dashboard data
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Desktop Dashboard - Using Convex */}
      <div className="hidden md:block">
        <DashboardClientConvex user={user} />
      </div>

      {/* Mobile Dashboard - Using Convex */}
      <div className="md:hidden">
        <MobileDashboardClientConvex
          key={refreshKey}
          user={user}
          onBookingClick={handleBookingClick}
        />
      </div>
    </div>
  );
}
