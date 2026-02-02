import { requireReviewerAuth } from "@/lib/auth-server";
import { PendingReviewsView } from "@/components/reviews/pending-reviews-view";

export default async function ReviewsPage() {
  const user = await requireReviewerAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Appointment Reviews</h1>
        <p className="text-muted-foreground">
          Review and approve pending appointments
        </p>
      </div>

      <PendingReviewsView userId={user.id} userRole={user.role} />
    </div>
  );
}
