"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

const categoryOptions = [
  "PRIVATE CASH",
  "PUBLIC SPONSORED(NHIA)",
  "PRIVATE SPONSORED",
  "PRIVATE DEPENDENT",
];

export function AddClientModal({
  isOpen,
  onClose,
  onClientAdded,
}: AddClientModalProps) {
  const [formData, setFormData] = useState({
    xNumber: "",
    name: "",
    phone: "",
    category: "",
    emergencyContact: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleXNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers

    if (value.length > 7) {
      value = value.slice(0, 7); // Limit to 7 digits
    }

    // Format as X12345/67
    let formatted = "";
    if (value.length > 0) {
      formatted = "X" + value.slice(0, 5);
      if (value.length > 5) {
        formatted += "/" + value.slice(5);
      }
    }

    setFormData({ ...formData, xNumber: formatted });

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const validateXNumber = (xNumber: string): boolean => {
    const pattern = /^X\d{5}\/\d{2}$/;
    return pattern.test(xNumber);
  };

  const handleSubmit = async (saveAndAddAnother: boolean = false) => {
    setLoading(true);
    setError("");

    // Validation
    if (
      !formData.xNumber ||
      !formData.name ||
      !formData.phone ||
      !formData.category
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    // Validate X-number format
    const digitsOnly = formData.xNumber.replace(/[^0-9]/g, "");
    if (digitsOnly.length !== 7 || !validateXNumber(formData.xNumber)) {
      setError("Please enter a complete X-number (7 digits required)");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add client");
      }

      // Reset form
      setFormData({
        xNumber: "",
        name: "",
        phone: "",
        category: "",
        emergencyContact: "",
        address: "",
      });

      onClientAdded();

      if (!saveAndAddAnother) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      xNumber: "",
      name: "",
      phone: "",
      category: "",
      emergencyContact: "",
      address: "",
    });
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Enter the client's information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="xNumber">X-Number *</Label>
              <Input
                id="xNumber"
                placeholder="X12345/67"
                value={formData.xNumber}
                onChange={handleXNumberChange}
                maxLength={10}
              />
              <p className="text-sm text-gray-500 mt-1">Format: X12345/67</p>
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                placeholder="+1234567891"
                value={formData.emergencyContact}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Enter address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save & Add Another"}
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={loading}>
            {loading ? "Saving..." : "Save Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
