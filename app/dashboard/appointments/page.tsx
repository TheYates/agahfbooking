import { requireAuth } from "@/lib/auth-server";
import { MobileAppointmentsClient } from "@/components/appointments/mobile-appointments-client";
import { MobileAppointmentsWrapper } from "@/components/appointments/mobile-appointments-wrapper";

// Original desktop appointments component
import OriginalAppointmentsPage from "./original-appointments";

export default async function AppointmentsPage() {
  const user = await requireAuth();

  return (
    <>
      {/* Desktop View - for staff or large screens */}
      <div className="hidden md:block">
        <OriginalAppointmentsPage />
      </div>

      {/* Mobile View - conditional based on user role */}
      <div className="md:hidden">
        {user.role === "client" ? (
          <MobileAppointmentsWrapper user={user} />
        ) : (
          <OriginalAppointmentsPage />
        )}
      </div>
    </>
  );
}
