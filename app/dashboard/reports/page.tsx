"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, Users, Clock, Download, BarChart3, PieChart } from "lucide-react"

interface ReportData {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  totalPatients: number
  newPatients: number
  doctorStats: Array<{
    name: string
    appointments: number
    completed: number
    rating: number
  }>
  categoryStats: Array<{
    category: string
    count: number
    percentage: number
  }>
  dailyStats: Array<{
    date: string
    appointments: number
    completed: number
  }>
  timeSlotStats: Array<{
    slot: number
    bookings: number
    utilization: number
  }>
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [dateRange, setDateRange] = useState("30")
  const [reportType, setReportType] = useState("overview")

  // Mock data
  useEffect(() => {
    const mockData: ReportData = {
      totalAppointments: 245,
      completedAppointments: 198,
      cancelledAppointments: 23,
      noShowAppointments: 24,
      totalPatients: 156,
      newPatients: 23,
      doctorStats: [
        { name: "Dr. Sarah Wilson", appointments: 89, completed: 76, rating: 4.8 },
        { name: "Dr. Michael Brown", appointments: 67, completed: 58, rating: 4.6 },
        { name: "Dr. Emily Davis", appointments: 54, completed: 45, rating: 4.9 },
        { name: "Dr. James Miller", appointments: 35, completed: 19, rating: 4.4 },
      ],
      categoryStats: [
        { category: "PRIVATE CASH", count: 98, percentage: 40 },
        { category: "PUBLIC SPONSORED(NHIA)", count: 73, percentage: 30 },
        { category: "PRIVATE SPONSORED", count: 49, percentage: 20 },
        { category: "PRIVATE DEPENDENT", count: 25, percentage: 10 },
      ],
      dailyStats: [
        { date: "2024-12-23", appointments: 12, completed: 10 },
        { date: "2024-12-24", appointments: 8, completed: 7 },
        { date: "2024-12-25", appointments: 0, completed: 0 },
        { date: "2024-12-26", appointments: 15, completed: 13 },
        { date: "2024-12-27", appointments: 18, completed: 16 },
        { date: "2024-12-28", appointments: 14, completed: 12 },
        { date: "2024-12-29", appointments: 16, completed: 14 },
      ],
      timeSlotStats: [
        { slot: 1, bookings: 28, utilization: 93 },
        { slot: 2, bookings: 26, utilization: 87 },
        { slot: 3, bookings: 25, utilization: 83 },
        { slot: 4, bookings: 24, utilization: 80 },
        { slot: 5, bookings: 23, utilization: 77 },
        { slot: 6, bookings: 22, utilization: 73 },
        { slot: 7, bookings: 20, utilization: 67 },
        { slot: 8, bookings: 18, utilization: 60 },
        { slot: 9, bookings: 16, utilization: 53 },
        { slot: 10, bookings: 13, utilization: 43 },
      ],
    }

    setReportData(mockData)
  }, [dateRange])

  const exportReport = () => {
    if (!reportData) return

    const csvContent = [
      ["Metric", "Value"],
      ["Total Appointments", reportData.totalAppointments.toString()],
      ["Completed Appointments", reportData.completedAppointments.toString()],
      ["Cancelled Appointments", reportData.cancelledAppointments.toString()],
      ["No Show Appointments", reportData.noShowAppointments.toString()],
      ["Total Patients", reportData.totalPatients.toString()],
      ["New Patients", reportData.newPatients.toString()],
      ["", ""],
      ["Doctor Performance", ""],
      ...reportData.doctorStats.map((doctor) => [
        doctor.name,
        `${doctor.completed}/${doctor.appointments} (${Math.round((doctor.completed / doctor.appointments) * 100)}%)`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hospital-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!reportData) {
    return <div>Loading...</div>
  }

  const completionRate = Math.round((reportData.completedAppointments / reportData.totalAppointments) * 100)
  const noShowRate = Math.round((reportData.noShowAppointments / reportData.totalAppointments) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Hospital performance insights and statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold">{reportData.totalAppointments}</p>
                <p className="text-xs text-green-600">+12% from last period</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-green-600">+3% from last period</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{reportData.totalPatients}</p>
                <p className="text-xs text-blue-600">{reportData.newPatients} new this period</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No Show Rate</p>
                <p className="text-2xl font-bold">{noShowRate}%</p>
                <p className="text-xs text-red-600">-2% from last period</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Doctor Performance
            </CardTitle>
            <CardDescription>Appointment completion rates by doctor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.doctorStats.map((doctor, index) => {
                const completionRate = Math.round((doctor.completed / doctor.appointments) * 100)
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{doctor.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {doctor.completed}/{doctor.appointments}
                        </span>
                        <Badge variant={completionRate >= 80 ? "default" : "secondary"}>{completionRate}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Rating: {doctor.rating}/5.0</span>
                      <span>{doctor.appointments} total appointments</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Patient Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Patient Categories
            </CardTitle>
            <CardDescription>Distribution of patients by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.categoryStats.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{category.count}</span>
                      <Badge variant="outline">{category.percentage}%</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Slot Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Time Slot Utilization</CardTitle>
          <CardDescription>Booking patterns across different time slots</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {reportData.timeSlotStats.map((slot) => (
              <div key={slot.slot} className="text-center space-y-2">
                <div className="text-sm font-medium">Slot {slot.slot}</div>
                <div className="relative h-20 w-full bg-gray-200 rounded">
                  <div
                    className="absolute bottom-0 w-full bg-blue-500 rounded transition-all duration-300"
                    style={{ height: `${slot.utilization}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">{slot.bookings} bookings</div>
                <div className="text-xs font-medium">{slot.utilization}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Appointment Trends</CardTitle>
          <CardDescription>Appointments and completion rates over the last week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.dailyStats.map((day, index) => {
              const completionRate = day.appointments > 0 ? Math.round((day.completed / day.appointments) * 100) : 0
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium min-w-[100px]">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {day.completed}/{day.appointments} completed
                      </span>
                      {day.appointments > 0 && (
                        <Badge variant={completionRate >= 80 ? "default" : "secondary"}>{completionRate}%</Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
