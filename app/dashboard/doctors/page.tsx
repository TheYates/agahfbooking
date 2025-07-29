"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Search, Plus, Edit, Trash2, CheckCircle, Calendar } from "lucide-react"

interface Doctor {
  id: number
  name: string
  specialization: string
  isActive: boolean
  phone?: string
  email?: string
  totalAppointments: number
  completedAppointments: number
  rating: number
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    specialization: "",
    phone: "",
    email: "",
  })

  // Mock data
  useEffect(() => {
    const mockDoctors: Doctor[] = [
      {
        id: 1,
        name: "Dr. Sarah Wilson",
        specialization: "General Medicine",
        isActive: true,
        phone: "+1234567890",
        email: "sarah.wilson@hospital.com",
        totalAppointments: 89,
        completedAppointments: 76,
        rating: 4.8,
      },
      {
        id: 2,
        name: "Dr. Michael Brown",
        specialization: "Cardiology",
        isActive: true,
        phone: "+1234567891",
        email: "michael.brown@hospital.com",
        totalAppointments: 67,
        completedAppointments: 58,
        rating: 4.6,
      },
      {
        id: 3,
        name: "Dr. Emily Davis",
        specialization: "Pediatrics",
        isActive: true,
        phone: "+1234567892",
        email: "emily.davis@hospital.com",
        totalAppointments: 54,
        completedAppointments: 45,
        rating: 4.9,
      },
      {
        id: 4,
        name: "Dr. James Miller",
        specialization: "Orthopedics",
        isActive: true,
        phone: "+1234567893",
        email: "james.miller@hospital.com",
        totalAppointments: 35,
        completedAppointments: 19,
        rating: 4.4,
      },
      {
        id: 5,
        name: "Dr. Lisa Anderson",
        specialization: "Dermatology",
        isActive: false,
        phone: "+1234567894",
        email: "lisa.anderson@hospital.com",
        totalAppointments: 28,
        completedAppointments: 22,
        rating: 4.7,
      },
    ]

    setDoctors(mockDoctors)
    setFilteredDoctors(mockDoctors)
  }, [])

  // Filter doctors
  useEffect(() => {
    let filtered = doctors

    if (searchTerm) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredDoctors(filtered)
  }, [doctors, searchTerm])

  const handleAddDoctor = async () => {
    setLoading(true)
    setError("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const doctor: Doctor = {
        id: Date.now(),
        name: newDoctor.name,
        specialization: newDoctor.specialization,
        phone: newDoctor.phone,
        email: newDoctor.email,
        isActive: true,
        totalAppointments: 0,
        completedAppointments: 0,
        rating: 0,
      }

      setDoctors([...doctors, doctor])
      setNewDoctor({ name: "", specialization: "", phone: "", email: "" })
      setIsAddModalOpen(false)
      setSuccess("Doctor added successfully!")
    } catch (err) {
      setError("Failed to add doctor")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDoctor = (id: number, updates: Partial<Doctor>) => {
    setDoctors(doctors.map((doctor) => (doctor.id === id ? { ...doctor, ...updates } : doctor)))
  }

  const handleDeleteDoctor = async (id: number) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setDoctors(doctors.filter((doctor) => doctor.id !== id))
      setSuccess("Doctor deleted successfully!")
    } catch (err) {
      setError("Failed to delete doctor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Doctors</h1>
          <p className="text-muted-foreground">Manage hospital doctors and their information</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Doctors</p>
                <p className="text-2xl font-bold">{doctors.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{doctors.filter((d) => d.isActive).length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(doctors.reduce((acc, d) => acc + d.rating, 0) / doctors.length).toFixed(1)}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {doctors.reduce((acc, d) => acc + d.totalAppointments, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search doctors by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Doctors List */}
      <Card>
        <CardHeader>
          <CardTitle>Doctors ({filteredDoctors.length})</CardTitle>
          <CardDescription>
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No doctors found matching your criteria</p>
              </div>
            ) : (
              filteredDoctors.map((doctor) => {
                const completionRate =
                  doctor.totalAppointments > 0
                    ? Math.round((doctor.completedAppointments / doctor.totalAppointments) * 100)
                    : 0

                return (
                  <div
                    key={doctor.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {doctor.name
                            .split(" ")
                            .map((n) => n[1] || n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{doctor.name}</span>
                          <Badge variant={doctor.isActive ? "default" : "secondary"} className="text-xs">
                            {doctor.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{doctor.specialization}</div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{doctor.totalAppointments} appointments</span>
                          <span>{completionRate}% completion rate</span>
                          <span>★ {doctor.rating}/5.0</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={doctor.isActive}
                        onCheckedChange={(checked) => handleUpdateDoctor(doctor.id, { isActive: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDoctor(doctor)
                          setIsEditModalOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDoctor(doctor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Doctor Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>Enter the doctor's information below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                placeholder="Dr. John Smith"
                required
              />
            </div>
            <div>
              <Label htmlFor="specialization">Specialization *</Label>
              <Input
                id="specialization"
                value={newDoctor.specialization}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                placeholder="General Medicine"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newDoctor.phone}
                onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newDoctor.email}
                onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                placeholder="doctor@hospital.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddDoctor} disabled={loading || !newDoctor.name || !newDoctor.specialization}>
              {loading ? "Adding..." : "Add Doctor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>Update the doctor's information.</DialogDescription>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={selectedDoctor.name}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-specialization">Specialization</Label>
                <Input
                  id="edit-specialization"
                  value={selectedDoctor.specialization}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, specialization: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={selectedDoctor.phone || ""}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedDoctor.email || ""}
                  onChange={(e) => setSelectedDoctor({ ...selectedDoctor, email: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedDoctor) {
                  handleUpdateDoctor(selectedDoctor.id, selectedDoctor)
                  setIsEditModalOpen(false)
                  setSuccess("Doctor updated successfully!")
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
