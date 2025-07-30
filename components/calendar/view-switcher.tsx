"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewSwitcherProps {
  currentView: "month" | "week" | "day";
  onViewChange: (view: "month" | "week" | "day") => void;
  disabled?: boolean;
}

export function ViewSwitcher({
  currentView,
  onViewChange,
  disabled = false,
}: ViewSwitcherProps) {
  const views = [
    { key: "month" as const, label: "Month" },
    { key: "week" as const, label: "Week" },
    { key: "day" as const, label: "Day" },
  ];

  return (
    <div className="flex items-center border rounded-lg p-0.5 sm:p-1 bg-muted/50">
      {views.map((view) => (
        <Button
          key={view.key}
          variant={currentView === view.key ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(view.key)}
          disabled={disabled && view.key === "day"}
          className={cn(
            "h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm transition-all",
            currentView === view.key
              ? "bg-background shadow-sm text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          {view.label}
        </Button>
      ))}
    </div>
  );
}
