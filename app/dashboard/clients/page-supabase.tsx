"use client";

import { useMemo, useState } from "react";
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
import {
  useClientsManagement,
  useDeleteClient,
} from "@/hooks/use-hospital-queries";

type Client = {
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
};

const CATEGORIES = [
  "PRIVATE CASH",
  "PUBLIC SPONSORED(NHIA)",
  "PRIVATE SPONSORED",
  "PRIVATE DEPENDENT",
];

export default function ClientsPageSupabase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const itemsPerPage = 10;

  const query = useClientsManagement({
    search: searchTerm || undefined,
    category: categoryFilter,
    status: statusFilter,
    page: currentPage,
    limit: itemsPerPage,
    sortBy,
    sortOrder,
  });

  const deleteClientMutation = useDeleteClient();

  const clients = (query.data?.data || []) as Client[];
  const pagination = query.data?.pagination;

  const totalPages = pagination?.totalPages || 1;

  const stats = useMemo(() => {
    const total = pagination?.totalCount ?? clients.length;
    const active = clients.filter((c) => c.status === "active").length;
    const inactive = clients.filter((c) => c.status === "inactive").length;
    return { total, active, inactive };
  }, [clients, pagination?.totalCount]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
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
      ...clients.map((client) => [
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

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
        Inactive
      </Badge>
    );
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "PRIVATE CASH":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "PUBLIC SPONSORED(NHIA)":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "PRIVATE SPONSORED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "PRIVATE DEPENDENT":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClientMutation.mutateAsync(clientToDelete.id);
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch {
      // hook already toasts
    }
  };

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
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Clients</div>
                <div className="text-xl font-bold">{stats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="text-xs text-muted-foreground">Active</div>
            <div className="text-xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="text-xs text-muted-foreground">Inactive</div>
            <div className="text-xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <CardTitle>Client List</CardTitle>
              <CardDescription>View and manage all registered clients</CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, X-number, or phone"
                  className="pl-8 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {query.isLoading ? (
            <div className="text-center py-8">Loading clients...</div>
          ) : query.error ? (
            <div className="text-center py-8 text-red-600">
              {(query.error as Error).message}
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("xNumber")}>
                      X-Number {renderSortIcon("xNumber")}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                      Name {renderSortIcon("name")}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("phone")}>
                      Phone {renderSortIcon("phone")}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                      Category {renderSortIcon("category")}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                      Status {renderSortIcon("status")}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No clients found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.xNumber}</TableCell>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryBadgeColor(client.category)}>
                            {client.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedClient(client);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedClient(client);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setClientToDelete(client);
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination?.currentPage ?? currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={() => {
          // hooks invalidate internally, but close modal anyway
          setShowAddModal(false);
        }}
      />

      {/* View Client Details */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>View full client information</DialogDescription>
          </DialogHeader>
          {selectedClient ? (
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">X-Number:</span> {selectedClient.xNumber}</div>
              <div><span className="font-medium">Name:</span> {selectedClient.name}</div>
              <div><span className="font-medium">Phone:</span> {selectedClient.phone}</div>
              <div><span className="font-medium">Category:</span> {selectedClient.category}</div>
              <div><span className="font-medium">Status:</span> {selectedClient.status}</div>
              {selectedClient.emergencyContact && (
                <div><span className="font-medium">Emergency:</span> {selectedClient.emergencyContact}</div>
              )}
              {selectedClient.address && (
                <div><span className="font-medium">Address:</span> {selectedClient.address}</div>
              )}
              {selectedClient.medicalNotes && (
                <div><span className="font-medium">Notes:</span> {selectedClient.medicalNotes}</div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client details</DialogDescription>
          </DialogHeader>
          {selectedClient ? (
            <EditClientForm
              client={selectedClient as any}
              onClientUpdated={() => {
                setShowEditModal(false);
              }}
              onClose={() => setShowEditModal(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {clientToDelete?.name}? If they have appointments,
              they will be marked inactive instead.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
