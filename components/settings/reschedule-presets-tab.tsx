"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Check, Loader2 } from "lucide-react";

interface Preset {
  id: number;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function ReschedulePresetsTab() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchPresets = async () => {
    try {
      const response = await fetch("/api/settings/reschedule-presets");
      if (response.ok) {
        const data = await response.json();
        setPresets(data.presets || []);
      }
    } catch (error) {
      console.error("Failed to fetch presets:", error);
      toast.error("Failed to load presets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleAdd = async () => {
    if (!newMessage.trim()) {
      toast.error("Message is required");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch("/api/settings/reschedule-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setPresets([...presets, data.preset]);
        setNewMessage("");
        toast.success("Preset added");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add preset");
      }
    } catch (error) {
      toast.error("Failed to add preset");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingMessage.trim()) {
      toast.error("Message is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/settings/reschedule-presets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editingMessage.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setPresets(
          presets.map((p) => (p.id === id ? data.preset : p))
        );
        setEditingId(null);
        setEditingMessage("");
        toast.success("Preset updated");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update preset");
      }
    } catch (error) {
      toast.error("Failed to update preset");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/settings/reschedule-presets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (response.ok) {
        setPresets(
          presets.map((p) =>
            p.id === id ? { ...p, is_active: isActive } : p
          )
        );
        toast.success(isActive ? "Preset enabled" : "Preset disabled");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update preset");
      }
    } catch (error) {
      toast.error("Failed to update preset");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this preset?")) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/reschedule-presets/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPresets(presets.filter((p) => p.id !== id));
        toast.success("Preset deleted");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete preset");
      }
    } catch (error) {
      toast.error("Failed to delete preset");
    }
  };

  const startEditing = (preset: Preset) => {
    setEditingId(preset.id);
    setEditingMessage(preset.message);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingMessage("");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reschedule Presets</CardTitle>
        <CardDescription>
          Manage preset messages for reschedule requests. Reviewers can quickly
          select these when requesting clients to reschedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={`flex items-start gap-3 rounded-md border p-3 ${
                !preset.is_active ? "opacity-50" : ""
              }`}
            >
              {editingId === preset.id ? (
                <div className="flex-1 space-y-2">
                  <Input
                    value={editingMessage}
                    onChange={(e) => setEditingMessage(e.target.value)}
                    placeholder="Enter preset message..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(preset.id)}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-sm">{preset.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={preset.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleActive(preset.id, checked)
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEditing(preset)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(preset.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {presets.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No presets yet. Add your first preset below.
            </p>
          )}
        </div>

        <div className="border-t pt-4">
          <Label className="mb-2 block">Add New Preset</Label>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter a new preset message..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={adding || !newMessage.trim()}>
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
