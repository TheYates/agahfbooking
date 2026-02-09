"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bug, Lightbulb, MessageCircle, HelpCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Feedback {
  id: number;
  user_id: number | null;
  user_type: string;
  user_name: string | null;
  user_contact: string | null;
  feedback_type: string;
  message: string;
  status: string;
  admin_notes: string | null;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
}

const FEEDBACK_TYPE_CONFIG = {
  bug: { label: "Bug", icon: Bug, color: "text-red-600", badgeVariant: "destructive" as const },
  feature_request: { label: "Feature", icon: Lightbulb, color: "text-yellow-600", badgeVariant: "default" as const },
  feedback: { label: "Feedback", icon: MessageCircle, color: "text-blue-600", badgeVariant: "secondary" as const },
  question: { label: "Question", icon: HelpCircle, color: "text-purple-600", badgeVariant: "outline" as const },
  other: { label: "Other", icon: AlertCircle, color: "text-gray-600", badgeVariant: "outline" as const },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700" },
};

export default function FeedbackManagementPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter, typeFilter]);

  const fetchFeedback = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch feedback");
      }

      setFeedback(data.feedback || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setUpdating(true);

    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update feedback");
      }

      toast.success("Feedback Updated! ✅");
      fetchFeedback();
      setDetailsOpen(false);
      setSelectedFeedback(null);
      setAdminNotes("");
    } catch (err) {
      toast.error("Update Failed", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setUpdating(false);
    }
  };

  const openDetails = (item: Feedback) => {
    setSelectedFeedback(item);
    setAdminNotes(item.admin_notes || "");
    setDetailsOpen(true);
  };

  const typeConfig = selectedFeedback
    ? FEEDBACK_TYPE_CONFIG[selectedFeedback.feedback_type as keyof typeof FEEDBACK_TYPE_CONFIG]
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback Management</h1>
        <p className="text-muted-foreground">
          View and manage user feedback, bug reports, and feature requests.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug Reports</SelectItem>
                <SelectItem value="feature_request">Feature Requests</SelectItem>
                <SelectItem value="feedback">General Feedback</SelectItem>
                <SelectItem value="question">Questions</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={fetchFeedback} disabled={loading} className="w-full">
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Items ({feedback.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No feedback found.
                  </TableCell>
                </TableRow>
              ) : (
                feedback.map((item) => {
                  const typeConfig = FEEDBACK_TYPE_CONFIG[item.feedback_type as keyof typeof FEEDBACK_TYPE_CONFIG];
                  const Icon = typeConfig?.icon || MessageCircle;
                  const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${typeConfig?.color}`} />
                          <span className="text-sm">{typeConfig?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{item.user_name || "Guest"}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {item.user_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{item.message}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig?.color}>
                          {statusConfig?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(item)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {typeConfig && <typeConfig.icon className={`h-5 w-5 ${typeConfig.color}`} />}
              Feedback Details
            </DialogTitle>
            <DialogDescription>
              Review and manage this feedback item
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground">Submitted by</div>
                  <div className="font-medium">{selectedFeedback.user_name || "Guest"}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {selectedFeedback.user_type}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Contact</div>
                  <div className="text-sm">{selectedFeedback.user_contact || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Submitted</div>
                  <div className="text-sm">
                    {new Date(selectedFeedback.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Type</div>
                  <Badge variant={typeConfig?.badgeVariant}>
                    {typeConfig?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <p className="mt-2 p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Update Status</label>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedFeedback.id, "in_progress")}
                    disabled={updating || selectedFeedback.status === "in_progress"}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedFeedback.id, "resolved")}
                    disabled={updating || selectedFeedback.status === "resolved"}
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedFeedback.id, "closed")}
                    disabled={updating || selectedFeedback.status === "closed"}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
