"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, Filter, Download, Plus, Eye } from "lucide-react"
import { AppointmentModal } from "@/components/calendar/appointment-modal"

interface Appointment {
  id: number
  clientId: number
  clientName: string
  clientXNumber: string
  doctorId: number
  doctorName: string
  date: string
  slotNumber: number
  status: string
  statusColor: string
  notes?: string
  phone: string
  category: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock data
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: 1,
        clientId: 1,
        clientName: "John Doe",
        clientXNumber: "X12345/67",
        doctorId: 1,
        doctorName: "Dr. Sarah Wilson",
        date: "2024-12-30",
        slotNumber: 3,
        status: "booked",
        statusColor: "#3B82F6",
        phone: "+1234567890",
        category: "PRIVATE CASH",
        notes: "Regular checkup",
      },
      {
        id: 2,
        clientId: 2,
        clientName: "Jane Smith",
        clientXNumber: "X98765/43",
        doctorId: 1,
        doctorName: "Dr. Sarah Wilson",
        date: "2024-12-30",
        slotNumber: 5,
        status: "completed",
        statusColor: "#059669",
        phone: "+0987654321",
        category: "PUBLIC SPONSORED(NHIA)",
      },
      {
        id: 3,
        clientId: 1,
        clientName: "John Doe",
        clientXNumber: "X12345/67",
        doctorId: 2,
        doctorName: "Dr. Michael Brown",
        date: "2025-01-02",
        slotNumber: 1,
        status: "booked",
        statusColor: "#3B82F6",
        phone: "+1234567890",
        category: "PRIVATE CASH",
      },
      {
        id: 4,
        clientId: 3,
        clientName: "Bob Johnson",
        clientXNumber: "X11111/22",
        doctorId: 1,
        doctorName: "Dr. Sarah Wilson",
        date: "2024-12-31",
        slotNumber: 2,
        status: "arrived",
        statusColor: "#10B981",
        phone: "+1111222333",
        category: "PRIVATE SPONSORED",
      },
      {
        id: 5,
        clientId: 2,
        clientName: "Jane Smith",
        clientXNumber: "X98765/43",
        doctorId: 3,
        doctorName: "Dr. Emily Davis",
        date: "2025-01-01",
        slotNumber: 4,
        status: "waiting",
        statusColor: "#F59E0B",
        phone: "+0987654321",
        category: "PUBLIC SPONSORED(NHIA)",
        notes: "Follow-up appointment",
      },
      {
        id: 6,
        clientId: 4,
        clientName: "Alice Brown",
        clientXNumber: "X22222/33",
        doctorId: 2,
        doctorName: "Dr. Michael Brown",
        date: "2024-12-29",
        slotNumber: 3,
        status: "no_show",
        statusColor: "#EF4444",
        phone: "+2222333444",
        category: "PRIVATE DEPENDENT",
      },
    ]

    setAppointments(mockAppointments)
    setFilteredAppointments(mockAppointments)
  }, [])

  // Filter appointments
  useEffect(() => {
    let filtered = appointments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.clientXNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]

      switch (dateFilter) {
        case "today":
          filtered = filtered.filter((apt) => apt.date === todayStr)
          break
        case "upcoming":
          filtered = filtered.filter((apt) => apt.date >= todayStr)
          break
        case "past":
          filtered = filtered.filter((apt) => apt.date < todayStr)
          break
      }
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, statusFilter, dateFilter])

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsModalOpen(true)
  }

  const handleAppointmentUpdate = (updatedAppointment: Appointment) => {
    setAppointments((prev) => prev.map((apt) => (apt.id === updatedAppointment.id ? updatedAppointment : apt)))
  }

  const handleAppointmentDelete = (appointmentId: number) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId))
  }

  const exportAppointments = () => {
    const csvContent = [
      ["Date", "Time Slot", "Patient", "X-Number", "Doctor", "Status", "Category", "Phone", "Notes"],
      ...filteredAppointments.map((apt) => [
        apt.date,
        `Slot ${apt.slotNumber}`,
        apt.clientName,
        apt.clientXNumber,
        apt.doctorName,
        apt.status,
        apt.category,
        apt.phone,
        apt.notes || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `appointments-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage all patient appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportAppointments} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search patients, doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setDateFilter("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
          <CardDescription>
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No appointments found matching your criteria</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {new Date(appointment.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">Slot {appointment.slotNumber}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{appointment.clientName}</span>
                        <span className="text-sm text-muted-foreground">({appointment.clientXNumber})</span>
                        <Badge variant="outline" className="text-xs">
                          {appointment.category}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.doctorName} • {appointment.phone}
                      </div>
                      {appointment.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{appointment.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      style={{
                        backgroundColor: appointment.statusColor + "20",
                        color: appointment.statusColor,
                        borderColor: appointment.statusColor + "40",
                      }}
                      className="capitalize"
                    >
                      {appointment.status.replace("_", " ")}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        userRole="admin"
        onAppointmentUpdate={handleAppointmentUpdate}
        onAppointmentDelete={handleAppointmentDelete}
      />
    </div>
  )
}
