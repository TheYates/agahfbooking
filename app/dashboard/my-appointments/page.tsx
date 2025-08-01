import { requireAuth } from "@/lib/auth";
import { MyAppointmentsView } from "@/components/appointments/my-appointments-view";

export default async function MyAppointmentsPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <p className="text-muted-foreground">
          View and manage all your appointments
        </p>
      </div>

      <MyAppointmentsView currentUserId={user.id} />
    </div>
  );
}
