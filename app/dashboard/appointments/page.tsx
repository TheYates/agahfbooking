import { requireAuth } from "@/lib/auth-server";
import { MobileAppointmentsWrapper } from "@/components/appointments/mobile-appointments-wrapper";
import { ReviewerMobileAppointments } from "@/components/appointments/reviewer-mobile-appointments";

// Desktop appointments component (Supabase/API driven)
import DesktopAppointments from "./desktop-appointments";

export default async function AppointmentsPage() {
  const user = await requireAuth();

  return (
    <>
      {/* Desktop View - for staff or large screens */}
      <div className="hidden md:block">
        <DesktopAppointments />
      </div>

      {/* Mobile View - conditional based on user role */}
      <div className="md:hidden">
        {user.role === "client" ? (
          <MobileAppointmentsWrapper user={user} />
        ) : user.role === "reviewer" ? (
          <ReviewerMobileAppointments user={user} />
        ) : (
          <DesktopAppointments />
        )}
      </div>
    </>
  );
}
