import { requireAuth } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <DashboardClient user={user} />
    </div>
  );
}
