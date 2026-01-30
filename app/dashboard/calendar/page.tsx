import { requireAuth } from "@/lib/auth";

// Calendar now uses Supabase/API backend
import { CalendarView } from "@/components/calendar/calendar-view";
import { MobileCalendarClientTanstack as MobileCalendarClient } from "@/components/calendar/mobile-calendar-client-tanstack";

export default async function CalendarPage() {
  const user = await requireAuth();

  return (
    <>
      {/* Desktop View - Convex Optimized */}
      <div className="hidden md:block space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            {user.role === "client"
              ? "View and manage your appointments"
              : "Manage all appointments and bookings"}
          </p>
        </div>

        <CalendarView userRole={user.role} currentUserId={user.id} />
      </div>

      {/* Mobile View - TanStack (can be migrated later) */}
      <div className="md:hidden">
        <MobileCalendarClient
          user={user}
          userRole={user.role}
          currentUserId={user.id}
        />
      </div>
    </>
  );
}
