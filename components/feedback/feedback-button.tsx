"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "./feedback-modal";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 h-14 w-14 p-0"
        size="icon"
        title="Send Feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
