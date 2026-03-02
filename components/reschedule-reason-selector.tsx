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

const OTHER_OPTION = "other";

export function RescheduleReasonSelector({
  value,
  onChange,
  placeholder = "Please specify the reason...",
  required = false,
  className = "",
  textareaClassName = "",
}: RescheduleReasonSelectorProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [customReason, setCustomReason] = useState("");

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

  const handleSelectChange = (optionValue: string) => {
    setSelectedOption(optionValue);
    
    if (optionValue === OTHER_OPTION) {
      // Switch to custom input, preserve any existing custom text
      onChange(customReason);
    } else {
      // Use preset message
      const preset = presets.find((p) => p.id === parseInt(optionValue));
      if (preset) {
        onChange(preset.message);
      }
    }
  };

  const handleCustomReasonChange = (text: string) => {
    setCustomReason(text);
    onChange(text);
  };

  const showTextarea = selectedOption === OTHER_OPTION;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <Label>
          Reason {required && <span className="text-destructive">*</span>}
        </Label>
        <Select 
          value={selectedOption} 
          onValueChange={handleSelectChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loading ? "Loading reasons..." : "Select a reason..."} />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id.toString()}>
                {preset.message}
              </SelectItem>
            ))}
            <SelectItem value={OTHER_OPTION}>Other (specify reason)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showTextarea && (
        <div className="space-y-2">
          <Label htmlFor="custom-reason" className="text-sm text-muted-foreground">
            Specify your reason
          </Label>
          <Textarea
            id="custom-reason"
            value={customReason}
            onChange={(e) => handleCustomReasonChange(e.target.value)}
            placeholder={placeholder}
            className={`min-h-[100px] ${textareaClassName}`}
          />
        </div>
      )}
    </div>
  );
}
