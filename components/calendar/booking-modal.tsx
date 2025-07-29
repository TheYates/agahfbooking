"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Doctor {
  id: number
  name: string
  specialization: string
}

interface Client {
  id: number
  xNumber: string
  name: string
  phone: string
  category: string
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  selectedSlot: number | null
  userRole: "client" | "receptionist" | "admin"
  currentUserId?: number
  onAppointmentBooked: (appointmentData: {
    date: string
    slotNumber: number
    doctorId: number
    clientId: number
    clientName: string
    clientXNumber: string
    notes?: string
  }) => void
}

export function BookingModal({
  isOpen,
  onClose,
  selectedDate,
  selectedSlot,
  userRole,
  currentUserId,
  onAppointmentBooked,
}: BookingModalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [clientSearch, setClientSearch] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Mock data
  useEffect(() => {
    const mockDoctors: Doctor[] = [
      { id: 1, name: "Dr. Sarah Wilson", specialization: "General Medicine" },
      { id: 2, name: "Dr. Michael Brown", specialization: "Cardiology" },
      { id: 3, name: "Dr. Emily Davis", specialization: "Pediatrics" },
      { id: 4, name: "Dr. James Miller", specialization: "Orthopedics" },
      { id: 5, name: "Dr. Lisa Anderson", specialization: "Dermatology" },
    ]

    const mockClients: Client[] = [
      { id: 1, xNumber: "X12345/67", name: "John Doe", phone: "+1234567890", category: "PRIVATE CASH" },
      { id: 2, xNumber: "X98765/43", name: "Jane Smith", phone: "+0987654321", category: "PUBLIC SPONSORED(NHIA)" },
      { id: 3, xNumber: "X11111/22", name: "Bob Johnson", phone: "+1111222333", category: "PRIVATE SPONSORED" },
      { id: 4, xNumber: "X22222/33", name: "Alice Brown", phone: "+2222333444", category: "PRIVATE DEPENDENT" },
    ]

    setDoctors(mockDoctors)
    setClients(mockClients)

    // For clients, pre-select themselves
    if (userRole === "client" && currentUserId) {
      setSelectedClientId(currentUserId.toString())
    }
  }, [userRole, currentUserId])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDoctorId("")
      if (userRole !== "client") {
        setSelectedClientId("")
      }
      setClientSearch("")
      setNotes("")
      setError("")
    }
  }, [isOpen, userRole])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!selectedDoctorId) {
        throw new Error("Please select a doctor")
      }

      if (!selectedClientId) {
        throw new Error("Please select a client")
      }

      if (!selectedDate || selectedSlot === null) {
        throw new Error("Invalid date or slot")
      }

      // Find client data
      const client = clients.find((c) => c.id === Number.parseInt(selectedClientId))
      if (!client) {
        throw new Error("Client not found")
      }

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const appointmentData = {
        date: selectedDate.toISOString().split("T")[0],
        slotNumber: selectedSlot,
        doctorId: Number.parseInt(selectedDoctorId),
        clientId: Number.parseInt(selectedClientId),
        clientName: client.name,
        clientXNumber: client.xNumber,
        notes,
      }

      console.log("Booking appointment:", appointmentData)

      // Call the callback to update the appointments list
      onAppointmentBooked(appointmentData)

      // Close modal
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment")
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.xNumber.toLowerCase().includes(clientSearch.toLowerCase()),
  )

  if (!selectedDate || selectedSlot === null) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Booking for{" "}
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            - Slot {selectedSlot}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="doctor">Doctor *</Label>
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    {doctor.name} - {doctor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(userRole === "receptionist" || userRole === "admin") && (
            <div>
              <Label htmlFor="client">Client *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search by name or X-number..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.xNumber} - {client.name} ({client.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for this appointment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
