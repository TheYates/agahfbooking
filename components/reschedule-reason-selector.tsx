"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Preset {
  id: number;
  message: string;
  is_active: boolean;
}

interface RescheduleReasonSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  textareaClassName?: string;
}

export function RescheduleReasonSelector({
  value,
  onChange,
  placeholder = "Enter a reason or select a preset...",
  required = false,
  className = "",
  textareaClassName = "",
}: RescheduleReasonSelectorProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPresets() {
      try {
        const response = await fetch("/api/settings/reschedule-presets");
        if (response.ok) {
          const data = await response.json();
          setPresets(data.presets?.filter((p: Preset) => p.is_active) || []);
        }
      } catch (error) {
        console.error("Failed to fetch presets:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPresets();
  }, []);

  const handlePresetSelect = (presetId: string) => {
    if (presetId === "custom") {
      return;
    }
    const preset = presets.find((p) => p.id === parseInt(presetId));
    if (preset) {
      onChange(preset.message);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <Label>
          Reason {required && <span className="text-destructive">*</span>}
        </Label>
        {!loading && presets.length > 0 && (
          <Select onValueChange={handlePresetSelect}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Quick select..." />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id.toString()}>
                  {preset.message.length > 30
                    ? preset.message.slice(0, 30) + "..."
                    : preset.message}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`min-h-[100px] ${textareaClassName}`}
      />
    </div>
  );
}
