"use client";

import { MobileAppointmentsClientTanstack as MobileAppointmentsClient } from "@/components/appointments/mobile-appointments-client-tanstack";
import type { User } from "@/lib/types";

interface MobileAppointmentsWrapperProps {
  user: User;
}

export function MobileAppointmentsWrapper({
  user,
}: MobileAppointmentsWrapperProps) {
  return <MobileAppointmentsClient user={user} />;
}
