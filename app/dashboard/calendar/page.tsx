import { requireAuth } from "@/lib/auth";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
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
  );
}
