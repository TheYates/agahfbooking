"use client";

import { MobileAppointmentsClient } from "@/components/appointments/mobile-appointments-client";
import type { User } from "@/lib/types";

interface MobileAppointmentsWrapperProps {
  user: User;
}

export function MobileAppointmentsWrapper({
  user,
}: MobileAppointmentsWrapperProps) {
  return <MobileAppointmentsClient user={user} />;
}
