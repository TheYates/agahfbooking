import { requireAuth } from "@/lib/auth-server";
import { MobileAppointmentsClient } from "@/components/appointments/mobile-appointments-client";
import { MobileAppointmentsWrapper } from "@/components/appointments/mobile-appointments-wrapper";

// Desktop appointments component (Convex version)
import DesktopAppointmentsConvex from "./desktop-appointments-convex";

export default async function AppointmentsPage() {
  const user = await requireAuth();

  return (
    <>
      {/* Desktop View - for staff or large screens - Now using Convex */}
      <div className="hidden md:block">
        <DesktopAppointmentsConvex />
      </div>

      {/* Mobile View - conditional based on user role */}
      <div className="md:hidden">
        {user.role === "client" ? (
          <MobileAppointmentsWrapper user={user} />
        ) : (
          <DesktopAppointmentsConvex />
        )}
      </div>
    </>
  );
}
