import { requireReviewerAuth } from "@/lib/auth-server";
import { PendingReviewsView } from "@/components/reviews/pending-reviews-view";

export default async function ReviewsPage() {
  const user = await requireReviewerAuth();

  return (
    <div className="h-full">
      <PendingReviewsView userId={user.id} userRole={user.role} />
    </div>
  );
}
