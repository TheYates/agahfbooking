"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddClientModal } from "@/components/clients/add-client-modal";
import { EditClientForm } from "@/components/clients/edit-client-form";

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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const itemsPerPage = 10;

  // Fetch clients from database
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/clients/stats?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch clients");
      }

      setClients(data.data);
      setFilteredClients(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchClients();
  }, []);

  // Refetch when filters or pagination change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        setCurrentPage(1); // Reset to first page when filters change
        fetchClients();
      },
      searchTerm ? 500 : 0
    ); // 500ms debounce for search, immediate for other filters

    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  // Refetch when page changes
  useEffect(() => {
    fetchClients();
  }, [currentPage]);

  // Helper functions
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleClientAdded = () => {
    fetchClients();
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      const response = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete client");
      }

      fetchClients();
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (err) {
      console.error("Error deleting client:", err);
      setError(err instanceof Error ? err.message : "Failed to delete client");
    }
  };

  const exportClients = () => {
    const csvContent = [
      [
        "X-Number",
        "Name",
        "Phone",
        "Category",
        "Status",
        "Join Date",
        "Total Appointments",
        "Last Appointment",
      ],
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
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage patient information and records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportClients} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Total Clients
                </p>
                <p className="text-xl lg:text-2xl font-bold">
                  {clients.length}
                </p>
              </div>
              <Users className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Active
                </p>
                <p className="text-xl lg:text-2xl font-bold text-green-600">
                  {clients.filter((c) => c.status === "active").length}
                </p>
              </div>
              <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Private Cash
                </p>
                <p className="text-xl lg:text-2xl font-bold text-purple-600">
                  {clients.filter((c) => c.category === "PRIVATE CASH").length}
                </p>
              </div>
              <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">NHIA</p>
                <p className="text-xl lg:text-2xl font-bold text-orange-600">
                  {
                    clients.filter(
                      (c) => c.category === "PUBLIC SPONSORED(NHIA)"
                    ).length
                  }
                </p>
              </div>
              <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <div className="h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                  <SelectItem value="PRIVATE SPONSORED">
                    Private Sponsored
                  </SelectItem>
                  <SelectItem value="PRIVATE DEPENDENT">
                    Private Dependent
                  </SelectItem>
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
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
          <CardDescription>
            {filteredClients.length} client
            {filteredClients.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading clients...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Error: {error}</p>
              <Button variant="outline" onClick={fetchClients} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No clients found matching your criteria</p>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("xNumber")}
                    >
                      <div className="flex items-center gap-1">
                        X-Number
                        {sortBy === "xNumber" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortBy === "name" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("phone")}
                    >
                      <div className="flex items-center gap-1">
                        Phone
                        {sortBy === "phone" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("category")}
                    >
                      <div className="flex items-center gap-1">
                        Category
                        {sortBy === "category" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortBy === "status" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("joinDate")}
                    >
                      <div className="flex items-center gap-1">
                        Join Date
                        {sortBy === "joinDate" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("totalAppointments")}
                    >
                      <div className="flex items-center gap-1">
                        Appointments
                        {sortBy === "totalAppointments" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("lastAppointment")}
                    >
                      <div className="flex items-center gap-1">
                        Last Visit
                        {sortBy === "lastAppointment" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="hover:bg-gray-50 cursor-pointer h-12"
                      onClick={() => {
                        setSelectedClient(client);
                        setShowDetailsModal(true);
                      }}
                    >
                      <TableCell className="font-mono text-sm py-2">
                        {client.xNumber}
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        {client.name}
                      </TableCell>
                      <TableCell className="py-2">{client.phone}</TableCell>
                      <TableCell className="py-2">{client.category}</TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant={
                            client.status === "active" ? "default" : "secondary"
                          }
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        {new Date(client.joinDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        {client.totalAppointments}
                      </TableCell>
                      <TableCell className="py-2">
                        {client.lastAppointment
                          ? new Date(client.lastAppointment).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "Never"}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClientToDelete(client);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredClients.length)}{" "}
                  of {filteredClients.length} clients
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={handleClientAdded}
      />

      {/* Client Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">X-Number</label>
                  <p className="text-sm bg-gray-100 p-2 rounded font-mono">
                    {selectedClient.xNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {selectedClient.category}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {selectedClient.phone}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Emergency Contact
                  </label>
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
                    {new Date(selectedClient.joinDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Total Appointments
                  </label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {selectedClient.totalAppointments}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Visit</label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {selectedClient.lastAppointment
                      ? new Date(
                          selectedClient.lastAppointment
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update information for {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <EditClientForm
              client={selectedClient}
              onClose={() => setShowEditModal(false)}
              onClientUpdated={handleClientAdded}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {clientToDelete?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This action cannot be undone. If the client has existing
              appointments, they will be marked as inactive instead of being
              deleted.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setClientToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteClient}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
