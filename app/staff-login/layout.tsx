import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function StaffLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>{children}</Suspense>;
}
