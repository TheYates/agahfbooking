"use client";

import { useState } from "react";
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

interface Client {
  id: number;
  xNumber: string;
  name: string;
  phone: string;
  category: string;
  joinDate: string;
  totalAppointments: number;
  lastAppointment?: string;
  status: "active" | "inactive";
  emergencyContact?: string;
  address?: string;
  medicalNotes?: string;
}

interface EditClientFormProps {
  client: Client;
  onClose: () => void;
  onClientUpdated: () => void;
}

export function EditClientForm({ client, onClose, onClientUpdated }: EditClientFormProps) {
  const [formData, setFormData] = useState({
    name: client.name,
    phone: client.phone,
    category: client.category,
    status: client.status,
    emergencyContact: client.emergencyContact || "",
    address: client.address || "",
    medicalNotes: client.medicalNotes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update client");
      }

      onClientUpdated();
      onClose();
    } catch (err) {
      console.error("Error updating client:", err);
      setError(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="xNumber">X-Number</Label>
          <Input
            id="xNumber"
            value={client.xNumber}
            disabled
            className="bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">X-Number cannot be changed</p>
        </div>
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="emergencyContact">Emergency Contact</Label>
          <Input
            id="emergencyContact"
            type="tel"
            value={formData.emergencyContact}
            onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIVATE CASH">Private Cash</SelectItem>
              <SelectItem value="PUBLIC SPONSORED(NHIA)">NHIA</SelectItem>
              <SelectItem value="PRIVATE SPONSORED">Private Sponsored</SelectItem>
              <SelectItem value="PRIVATE DEPENDENT">Private Dependent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange("status", value as "active" | "inactive")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="medicalNotes">Medical Notes</Label>
        <Textarea
          id="medicalNotes"
          value={formData.medicalNotes}
          onChange={(e) => handleInputChange("medicalNotes", e.target.value)}
          rows={3}
          placeholder="Any relevant medical information..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Client"}
        </Button>
      </div>
    </form>
  );
}
