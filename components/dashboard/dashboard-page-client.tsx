// @ts-nocheck
"use client";

import { useState } from "react";
import { DashboardClientTanstack as DashboardClient } from "@/components/dashboard-client-tanstack";
import { MobileDashboardClient } from "@/components/dashboard/mobile-dashboard-client";
import { AdminDashboardClient } from "@/components/dashboard/admin-dashboard-client";
import { ReviewerMobileDashboard } from "@/components/dashboard/reviewer-mobile-dashboard";
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

  // 1. CLIENT VIEW
  if (user.role === "client") {
    return (
      <div className="space-y-6">
        {/* Desktop Dashboard */}
        <div className="hidden md:block">
          <DashboardClient user={user} />
        </div>

        {/* Mobile Dashboard */}
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

  // 2. REVIEWER VIEW (Mobile First + Tablet Support)
  // Reviewers get a native-app-like experience on Mobile AND Tablet (up to lg breakpoint)
  if (user.role === "reviewer") {
    return (
      <div className="space-y-6">
        {/* Desktop View (Large Screens only) */}
        <div className="hidden lg:block">
          <AdminDashboardClient user={user} />
        </div>

        {/* Mobile/Tablet View (< 1024px) */}
        <div className="lg:hidden">
          <ReviewerMobileDashboard user={user} />
        </div>
      </div>
    );
  }

  // 3. ADMIN/STAFF VIEW
  // Default fallback for Admin, Receptionist, etc.
  return <AdminDashboardClient user={user} />;
}
