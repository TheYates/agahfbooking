import { requireAuth } from "@/lib/auth-server";
import { MobileAppointmentsClient } from "@/components/appointments/mobile-appointments-client";
import { MobileAppointmentsWrapper } from "@/components/appointments/mobile-appointments-wrapper";

// Desktop appointments component
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
        ) : (
          <DesktopAppointments />
        )}
      </div>
    </>
  );
}
