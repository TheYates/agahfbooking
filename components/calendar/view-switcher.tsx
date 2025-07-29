"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ViewSwitcherProps {
  currentView: "month" | "week" | "day"
  onViewChange: (view: "month" | "week" | "day") => void
  disabled?: boolean
}

export function ViewSwitcher({ currentView, onViewChange, disabled = false }: ViewSwitcherProps) {
  const views = [
    { key: "month" as const, label: "Month" },
    { key: "week" as const, label: "Week" },
    { key: "day" as const, label: "Day" },
  ]

  return (
    <div className="flex items-center border rounded-lg p-1 bg-muted">
      {views.map((view) => (
        <Button
          key={view.key}
          variant={currentView === view.key ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(view.key)}
          disabled={disabled && view.key === "day"}
          className={cn("h-8 px-3", currentView === view.key && "bg-background shadow-sm")}
        >
          {view.label}
        </Button>
      ))}
    </div>
  )
}
