"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { BookingModal } from "./booking-modal"
import { ViewSwitcher } from "./view-switcher"
import { AppointmentModal } from "./appointment-modal"

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
}

interface Doctor {
  id: number
  name: string
  specialization: string
}

interface CalendarViewProps {
  userRole: "client" | "receptionist" | "admin"
  currentUserId?: number
}

export function CalendarView({ userRole, currentUserId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    selectedDate: null as Date | null,
    selectedSlot: null as number | null,
  })
  const [appointmentModal, setAppointmentModal] = useState({
    isOpen: false,
    appointment: null as Appointment | null,
  })

  // Mock data
  useEffect(() => {
    const mockDoctors: Doctor[] = [
      { id: 1, name: "Dr. Sarah Wilson", specialization: "General Medicine" },
      { id: 2, name: "Dr. Michael Brown", specialization: "Cardiology" },
      { id: 3, name: "Dr. Emily Davis", specialization: "Pediatrics" },
      { id: 4, name: "Dr. James Miller", specialization: "Orthopedics" },
      { id: 5, name: "Dr. Lisa Anderson", specialization: "Dermatology" },
    ]

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
      },
    ]

    setDoctors(mockDoctors)
    setAppointments(mockAppointments)
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }

    return weekDays
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    let dayAppointments = appointments.filter((apt) => apt.date === dateString)

    // Filter appointments based on user role
    if (userRole === "client" && currentUserId) {
      dayAppointments = dayAppointments.filter((apt) => apt.clientId === currentUserId)
    }

    return dayAppointments
  }

  const maskXNumber = (xNumber: string, isOwnAppointment: boolean) => {
    if (userRole !== "client" || isOwnAppointment) {
      return xNumber
    }
    return xNumber.substring(0, 4) + "**/**"
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 7)
      } else {
        newDate.setDate(prev.getDate() + 7)
      }
      return newDate
    })
  }

  const navigateDay = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 1)
      } else {
        newDate.setDate(prev.getDate() + 1)
      }
      return newDate
    })
  }

  const handleBookSlot = (date: Date, slotNumber: number) => {
    setBookingModal({
      isOpen: true,
      selectedDate: date,
      selectedSlot: slotNumber,
    })
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setAppointmentModal({
      isOpen: true,
      appointment,
    })
  }

  const handleAppointmentBooked = (appointmentData: {
    date: string
    slotNumber: number
    doctorId: number
    clientId: number
    clientName: string
    clientXNumber: string
    notes?: string
  }) => {
    const doctor = doctors.find((d) => d.id === appointmentData.doctorId)
    if (!doctor) return

    const newAppointment: Appointment = {
      id: Date.now(),
      clientId: appointmentData.clientId,
      clientName: appointmentData.clientName,
      clientXNumber: appointmentData.clientXNumber,
      doctorId: appointmentData.doctorId,
      doctorName: doctor.name,
      date: appointmentData.date,
      slotNumber: appointmentData.slotNumber,
      status: "booked",
      statusColor: "#3B82F6",
      notes: appointmentData.notes,
    }

    setAppointments((prev) => [...prev, newAppointment])
  }

  const handleAppointmentUpdate = (updatedAppointment: Appointment) => {
    setAppointments((prev) => prev.map((apt) => (apt.id === updatedAppointment.id ? updatedAppointment : apt)))
  }

  const handleAppointmentDelete = (appointmentId: number) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId))
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date, targetSlot: number, targetDoctorId?: number) => {
    e.preventDefault()
    if (!draggedAppointment) return

    const dateString = targetDate.toISOString().split("T")[0]

    // Check if slot is already occupied
    const existingAppointment = appointments.find(
      (apt) =>
        apt.date === dateString &&
        apt.slotNumber === targetSlot &&
        (targetDoctorId ? apt.doctorId === targetDoctorId : true) &&
        apt.id !== draggedAppointment.id,
    )

    if (existingAppointment) {
      alert("This slot is already occupied!")
      setDraggedAppointment(null)
      return
    }

    // Update appointment
    const updatedAppointment = {
      ...draggedAppointment,
      date: dateString,
      slotNumber: targetSlot,
      ...(targetDoctorId && { doctorId: targetDoctorId }),
    }

    if (targetDoctorId) {
      const doctor = doctors.find((d) => d.id === targetDoctorId)
      if (doctor) {
        updatedAppointment.doctorName = doctor.name
      }
    }

    setAppointments((prev) => prev.map((apt) => (apt.id === draggedAppointment.id ? updatedAppointment : apt)))
    setDraggedAppointment(null)
  }

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate)
    const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{monthName}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <ViewSwitcher currentView={view} onViewChange={setView} />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-2 h-24" />
            }

            const dayAppointments = getAppointmentsForDate(day)
            const isToday = new Date().toDateString() === day.toDateString()

            return (
              <div
                key={index}
                className={cn(
                  "p-2 h-24 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
                  isToday && "bg-blue-50",
                )}
                onClick={() => handleBookSlot(day, 1)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day, 1)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn("text-sm", isToday && "font-bold text-blue-600")}>{day.getDate()}</span>
                  {dayAppointments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayAppointments.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <div
                      key={apt.id}
                      className="text-xs p-1 rounded truncate cursor-pointer"
                      style={{ backgroundColor: apt.statusColor + "20", color: apt.statusColor }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAppointmentClick(apt)
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, apt)}
                    >
                      Slot {apt.slotNumber} - {apt.doctorName.split(" ")[1]}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-muted-foreground">+{dayAppointments.length - 2} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate)
    const weekStart = weekDays[0]
    const weekEnd = weekDays[6]
    const weekRange = `${weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${weekEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{weekRange}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <ViewSwitcher currentView={view} onViewChange={setView} />
          </div>
        </div>

        <div className="grid grid-cols-8 gap-2">
          <div className="space-y-2">
            <div className="h-16 flex items-center justify-center font-medium text-sm text-muted-foreground">Slots</div>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="h-12 flex items-center justify-center text-sm font-medium bg-gray-50 rounded">
                {i + 1}
              </div>
            ))}
          </div>

          {weekDays.map((day, dayIndex) => {
            const dayAppointments = getAppointmentsForDate(day)
            const isToday = new Date().toDateString() === day.toDateString()

            return (
              <div key={dayIndex} className="space-y-2">
                <div
                  className={cn(
                    "h-16 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center justify-center",
                    isToday && "bg-blue-50",
                  )}
                  onClick={() => handleBookSlot(day, 1)}
                >
                  <div className="text-xs text-muted-foreground">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className={cn("text-lg font-semibold", isToday && "text-blue-600")}>{day.getDate()}</div>
                  {dayAppointments.length > 0 && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {dayAppointments.length}
                    </Badge>
                  )}
                </div>

                {Array.from({ length: 10 }, (_, slotIndex) => {
                  const slotNumber = slotIndex + 1
                  const appointment = dayAppointments.find((apt) => apt.slotNumber === slotNumber)

                  return (
                    <div
                      key={slotIndex}
                      className={cn(
                        "h-12 p-1 border rounded cursor-pointer transition-colors",
                        appointment ? "border-l-4" : "hover:bg-gray-50",
                      )}
                      style={appointment ? { borderLeftColor: appointment.statusColor } : {}}
                      onClick={() =>
                        appointment ? handleAppointmentClick(appointment) : handleBookSlot(day, slotNumber)
                      }
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day, slotNumber)}
                    >
                      {appointment ? (
                        <div
                          className="h-full flex flex-col justify-center"
                          draggable
                          onDragStart={(e) => handleDragStart(e, appointment)}
                        >
                          <div className="text-xs font-medium truncate">
                            {maskXNumber(appointment.clientXNumber, appointment.clientId === currentUserId)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {appointment.doctorName.split(" ")[1]}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                          Available
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate)
    const dateString = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{dateString}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDay("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDay("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <ViewSwitcher currentView={view} onViewChange={setView} />
            {(userRole === "receptionist" || userRole === "admin") && (
              <Button onClick={() => handleBookSlot(currentDate, 1)}>
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            )}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid grid-cols-11 bg-gray-50 border-b">
                <div className="p-3 font-medium text-sm border-r min-w-[200px]">Doctor</div>
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="p-3 text-center font-medium text-sm border-r last:border-r-0 min-w-[100px]">
                    Slot {i + 1}
                  </div>
                ))}
              </div>

              {/* Doctor rows */}
              {doctors.map((doctor) => {
                const doctorAppointments = dayAppointments.filter((apt) => apt.doctorId === doctor.id)

                return (
                  <div key={doctor.id} className="grid grid-cols-11 border-b last:border-b-0">
                    <div className="p-4 border-r bg-gray-25 min-w-[200px]">
                      <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                        {doctor.name}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                        {doctor.specialization}
                      </div>
                    </div>

                    {Array.from({ length: 10 }, (_, slotIndex) => {
                      const slotNumber = slotIndex + 1
                      const appointment = doctorAppointments.find((apt) => apt.slotNumber === slotNumber)

                      return (
                        <div
                          key={slotIndex}
                          className="border-r last:border-r-0 min-h-[80px] min-w-[100px] relative group"
                          style={{ backgroundColor: appointment ? appointment.statusColor + "10" : "transparent" }}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, currentDate, slotNumber, doctor.id)}
                        >
                          {appointment ? (
                            <div className="p-2 h-full">
                              <div
                                className="h-full rounded p-2 text-white text-xs relative cursor-pointer"
                                style={{ backgroundColor: appointment.statusColor }}
                                onClick={() => handleAppointmentClick(appointment)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, appointment)}
                              >
                                <div className="font-medium">
                                  {maskXNumber(appointment.clientXNumber, appointment.clientId === currentUserId)}
                                </div>
                                <div className="opacity-90">{appointment.clientName}</div>
                                {appointment.notes && (
                                  <div className="opacity-75 text-xs mt-1 truncate">{appointment.notes}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              className="h-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group"
                              onClick={() => handleBookSlot(currentDate, slotNumber)}
                            >
                              <div className="border-2 border-dashed border-gray-300 rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {view === "month" && renderMonthView()}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}

      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, selectedDate: null, selectedSlot: null })}
        selectedDate={bookingModal.selectedDate}
        selectedSlot={bookingModal.selectedSlot}
        userRole={userRole}
        currentUserId={currentUserId}
        onAppointmentBooked={handleAppointmentBooked}
      />

      <AppointmentModal
        isOpen={appointmentModal.isOpen}
        onClose={() => setAppointmentModal({ isOpen: false, appointment: null })}
        appointment={appointmentModal.appointment}
        userRole={userRole}
        currentUserId={currentUserId}
        onAppointmentUpdate={handleAppointmentUpdate}
        onAppointmentDelete={handleAppointmentDelete}
      />
    </div>
  )
}
