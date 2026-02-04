import { requireReviewerAuth } from "@/lib/auth-server";
import { PendingReviewsView } from "@/components/reviews/pending-reviews-view";
import { PendingReviewsMobileList } from "@/components/reviews/pending-reviews-mobile-list";

export default async function ReviewsPage() {
  const user = await requireReviewerAuth();

  return (
    <div className="h-full">
      {/* Desktop - Table View */}
      <div className="hidden md:block">
        <PendingReviewsView userId={user.id} userRole={user.role} />
      </div>

      {/* Mobile - List View */}
      <div className="md:hidden">
        <PendingReviewsMobileList user={user} />
      </div>
    </div>
  );
}
