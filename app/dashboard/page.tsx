import { requireAuth } from "@/lib/auth-server";
import { DashboardClient } from "@/components/dashboard-client";
import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";

export default async function DashboardPage() {
  const user = await requireAuth();

  return <DashboardPageClient user={user} />;
}
