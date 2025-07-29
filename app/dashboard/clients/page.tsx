"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, Search, Filter, Download, Plus, Eye, Calendar, Phone } from "lucide-react"

interface Client {
  id: number
  xNumber: string
  name: string
  phone: string
  category: string
  joinDate: string
  totalAppointments: number
  lastAppointment?: string
  status: "active" | "inactive"
  emergencyContact?: string
  address?: string
  medicalNotes?: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Mock data
  useEffect(() => {
    const mockClients: Client[] = [
      {
        id: 1,
        xNumber: "X12345/67",
        name: "John Doe",
        phone: "+1234567890",
        category: "PRIVATE CASH",
        joinDate: "2024-01-15",
        totalAppointments: 15,
        lastAppointment: "2024-12-30",
        status: "active",
        emergencyContact: "+1234567891",
        address: "123 Main St, City, State 12345",
        medicalNotes: "No known allergies",
      },
      {
        id: 2,
        xNumber: "X98765/43",
        name: "Jane Smith",
        phone: "+0987654321",
        category: "PUBLIC SPONSORED(NHIA)",
        joinDate: "2024-02-20",
        totalAppointments: 8,
        lastAppointment: "2024-12-30",
        status: "active",
        emergencyContact: "+0987654322",
        address: "456 Oak Ave, City, State 12345",
      },
      {
        id: 3,
        xNumber: "X11111/22",
        name: "Bob Johnson",
        phone: "+1111222333",
        category: "PRIVATE SPONSORED",
        joinDate: "2024-03-10",
        totalAppointments: 5,
        lastAppointment: "2024-12-31",
        status: "active",
        medicalNotes: "Diabetic - requires special attention",
      },
      {
        id: 4,
        xNumber: "X22222/33",
        name: "Alice Brown",
        phone: "+2222333444",
        category: "PRIVATE DEPENDENT",
        joinDate: "2024-04-05",
        totalAppointments: 3,
        lastAppointment: "2024-12-29",
        status: "active",
      },
      {
        id: 5,
        xNumber: "X33333/44",
        name: "Charlie Wilson",
        phone: "+3333444555",
        category: "PRIVATE CASH",
        joinDate: "2024-01-30",
        totalAppointments: 12,
        status: "inactive",
      },
    ]

    setClients(mockClients)
    setFilteredClients(mockClients)
  }, [])

  // Filter clients
  useEffect(() => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.xNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm),
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((client) => client.category === categoryFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, categoryFilter, statusFilter])

  const exportClients = () => {
    const csvContent = [
      ["X-Number", "Name", "Phone", "Category", "Status", "Join Date", "Total Appointments", "Last Appointment"],
      ...filteredClients.map((client) => [
        client.xNumber,
        client.name,
        client.phone,
        client.category,
        client.status,
        client.joinDate,
        client.totalAppointments.toString(),
        client.lastAppointment || "Never",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clients-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage patient information and records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportClients} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter((c) => c.status === "active").length}
                </p>
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
                <p className="text-sm text-muted-foreground">Private Cash</p>
                <p className="text-2xl font-bold text-purple-600">
                  {clients.filter((c) => c.category === "PRIVATE CASH").length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NHIA</p>
                <p className="text-2xl font-bold text-orange-600">
                  {clients.filter((c) => c.category === "PUBLIC SPONSORED(NHIA)").length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
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
                  placeholder="Search name, X-number, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="PRIVATE CASH">Private Cash</SelectItem>
                  <SelectItem value="PUBLIC SPONSORED(NHIA)">NHIA</SelectItem>
                  <SelectItem value="PRIVATE SPONSORED">Private Sponsored</SelectItem>
                  <SelectItem value="PRIVATE DEPENDENT">Private Dependent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setStatusFilter("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
          <CardDescription>
            {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No clients found matching your criteria</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{client.name}</span>
                        <span className="text-sm text-muted-foreground">({client.xNumber})</span>
                        <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-xs">
                          {client.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </span>
                        <span>{client.category}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {client.totalAppointments} appointments
                        </span>
                      </div>
                      {client.lastAppointment && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Last visit: {new Date(client.lastAppointment).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedClient(client)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Client Details</DialogTitle>
                          <DialogDescription>Complete information for {client.name}</DialogDescription>
                        </DialogHeader>
                        {selectedClient && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">X-Number</label>
                                <p className="text-sm bg-gray-100 p-2 rounded font-mono">{selectedClient.xNumber}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Category</label>
                                <p className="text-sm bg-gray-100 p-2 rounded">{selectedClient.category}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Phone</label>
                                <p className="text-sm bg-gray-100 p-2 rounded">{selectedClient.phone}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Emergency Contact</label>
                                <p className="text-sm bg-gray-100 p-2 rounded">
                                  {selectedClient.emergencyContact || "Not provided"}
                                </p>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Address</label>
                              <p className="text-sm bg-gray-100 p-2 rounded">
                                {selectedClient.address || "Not provided"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Medical Notes</label>
                              <p className="text-sm bg-gray-100 p-2 rounded min-h-[60px]">
                                {selectedClient.medicalNotes || "No medical notes"}
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium">Join Date</label>
                                <p className="text-sm bg-gray-100 p-2 rounded">
                                  {new Date(selectedClient.joinDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Total Appointments</label>
                                <p className="text-sm bg-gray-100 p-2 rounded">{selectedClient.totalAppointments}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Last Visit</label>
                                <p className="text-sm bg-gray-100 p-2 rounded">
                                  {selectedClient.lastAppointment
                                    ? new Date(selectedClient.lastAppointment).toLocaleDateString()
                                    : "Never"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
