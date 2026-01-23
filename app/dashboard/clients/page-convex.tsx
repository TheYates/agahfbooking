"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, Search, UserCheck, UserX, Users, Eye, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface Client {
  _id: Id<"clients">;
  x_number: string;
  name: string;
  phone: string;
  category: string;
  emergency_contact?: string;
  address?: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

const CATEGORIES = [
  "PRIVATE CASH",
  "PUBLIC SPONSORED(NHIA)",
  "PRIVATE SPONSORED",
  "PRIVATE DEPENDENT",
];

export default function ClientsPageConvex() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    x_number: "",
    name: "",
    phone: "",
    category: "PRIVATE CASH",
    emergency_contact: "",
    address: "",
  });

  // Convex queries and mutations
  const allClients = useQuery(api.queries.getClients, {});
  const createClient = useMutation(api.mutations.createClient);
  const updateClient = useMutation(api.mutations.updateClient);
  const deleteClient = useMutation(api.mutations.deleteClient);

  const loading = allClients === undefined;
  const error = allClients === null;

  // Filter, sort, and paginate clients
  const filteredClients = allClients?.filter((client) => {
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesSearch = 
        client.name.toLowerCase().includes(search) ||
        client.x_number.toLowerCase().includes(search) ||
        client.phone.includes(search);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (categoryFilter !== "all" && client.category !== categoryFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active" && !client.is_active) return false;
      if (statusFilter === "inactive" && client.is_active) return false;
    }

    return true;
  }) || [];

  // Sort clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case "xNumber":
        aVal = a.x_number;
        bVal = b.x_number;
        break;
      case "name":
        aVal = a.name;
        bVal = b.name;
        break;
      case "phone":
        aVal = a.phone;
        bVal = b.phone;
        break;
      case "category":
        aVal = a.category;
        bVal = b.category;
        break;
      case "status":
        aVal = a.is_active ? "active" : "inactive";
        bVal = b.is_active ? "active" : "inactive";
        break;
      case "joinDate":
        aVal = a.created_at;
        bVal = b.created_at;
        break;
      default:
        aVal = a.name;
        bVal = b.name;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate clients
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = sortedClients.slice(startIndex, endIndex);

  // Helper functions
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleViewClient = (client: Client) => {
    setViewingClient(client);
    setIsViewDialogOpen(true);
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      "PRIVATE CASH": "bg-blue-100 text-blue-800",
      "PUBLIC SPONSORED(NHIA)": "bg-green-100 text-green-800",
      "PRIVATE SPONSORED": "bg-purple-100 text-purple-800",
      "PRIVATE DEPENDENT": "bg-orange-100 text-orange-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleAddClient = async () => {
    try {
      if (!formData.x_number || !formData.name || !formData.phone || !formData.category) {
        toast.error("X-Number, name, phone, and category are required");
        return;
      }

      // Validate X-number format
      const xNumberPattern = /^X\d{5}\/\d{2}$/;
      if (!xNumberPattern.test(formData.x_number)) {
        toast.error("X-Number must follow the format X12345/67");
        return;
      }

      await createClient({
        x_number: formData.x_number,
        name: formData.name,
        phone: formData.phone,
        category: formData.category,
        emergency_contact: formData.emergency_contact || undefined,
        address: formData.address || undefined,
      });

      toast.success("Client created successfully");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create client");
    }
  };

  const handleEditClient = async () => {
    try {
      if (!editingClient || !formData.name || !formData.phone || !formData.category) {
        toast.error("Name, phone, and category are required");
        return;
      }

      await updateClient({
        id: editingClient._id,
        name: formData.name,
        phone: formData.phone,
        category: formData.category,
        emergency_contact: formData.emergency_contact || undefined,
        address: formData.address || undefined,
      });

      toast.success("Client updated successfully");
      setIsEditDialogOpen(false);
      setEditingClient(null);
      resetForm();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update client");
    }
  };

  const handleDeleteClient = async () => {
    try {
      if (!deletingClient) return;

      await deleteClient({ id: deletingClient._id });

      toast.success("Client deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingClient(null);
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete client");
    }
  };

  const handleToggleActive = async (client: Client) => {
    try {
      await updateClient({
        id: client._id,
        is_active: !client.is_active,
      });

      toast.success(
        `Client ${client.is_active ? "deactivated" : "activated"} successfully`
      );
    } catch (error) {
      console.error("Error toggling client active status:", error);
      toast.error("Failed to update client status");
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      x_number: client.x_number,
      name: client.name,
      phone: client.phone,
      category: client.category,
      emergency_contact: client.emergency_contact || "",
      address: client.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (client: Client) => {
    setDeletingClient(client);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      x_number: "",
      name: "",
      phone: "",
      category: "PRIVATE CASH",
      emergency_contact: "",
      address: "",
    });
  };

  // Stats
  const totalClients = allClients?.length || 0;
  const activeClients = allClients?.filter((c) => c.is_active).length || 0;
  const inactiveClients = allClients?.filter((c) => !c.is_active).length || 0;
  const categoriesCount = new Set(allClients?.map((c) => c.category)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage patient records and information
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1">
                  Total Clients
                </p>
                <p className="text-xl lg:text-2xl font-bold">{totalClients}</p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1">
                  Active
                </p>
                <p className="text-xl lg:text-2xl font-bold text-green-600">
                  {activeClients}
                </p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1">
                  Inactive
                </p>
                <p className="text-xl lg:text-2xl font-bold text-gray-600">
                  {inactiveClients}
                </p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1">
                  Categories
                </p>
                <p className="text-xl lg:text-2xl font-bold text-orange-600">
                  {categoriesCount}
                </p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-orange-100 flex items-center justify-center">
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  setSearchQuery("");
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
              <p>Error loading clients</p>
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
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client._id}>
                      <TableCell className="font-mono text-sm">
                        {client.x_number}
                      </TableCell>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(client.category)}>
                          {client.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.is_active ? "default" : "secondary"}>
                          {client.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(client.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewClient(client)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(client)}
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, sortedClients.length)} of{" "}
                    {sortedClients.length} clients
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client record with patient information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="x_number">X-Number *</Label>
              <Input
                id="x_number"
                value={formData.x_number}
                onChange={(e) => setFormData({ ...formData, x_number: e.target.value })}
                placeholder="e.g., X12345/67"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: X12345/67
              </p>
            </div>
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Client's full name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g., +233 24 123 4567"
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                type="tel"
                value={formData.emergency_contact}
                onChange={(e) =>
                  setFormData({ ...formData, emergency_contact: e.target.value })
                }
                placeholder="Emergency contact phone"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Client's address"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClient}>Create Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information (X-Number cannot be changed)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>X-Number</Label>
              <Input value={formData.x_number} disabled />
              <p className="text-xs text-muted-foreground mt-1">
                X-Number cannot be modified
              </p>
            </div>
            <div>
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-emergency_contact">Emergency Contact</Label>
              <Input
                id="edit-emergency_contact"
                type="tel"
                value={formData.emergency_contact}
                onChange={(e) =>
                  setFormData({ ...formData, emergency_contact: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClient}>Update Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Client Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewingClient?.name}
            </DialogDescription>
          </DialogHeader>
          {viewingClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">X-Number</label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
                    {viewingClient.x_number}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    <Badge variant={viewingClient.is_active ? "default" : "secondary"}>
                      {viewingClient.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {viewingClient.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {viewingClient.phone}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <div className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <Badge className={getCategoryBadgeColor(viewingClient.category)}>
                    {viewingClient.category}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Emergency Contact</label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {viewingClient.emergency_contact || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Join Date</label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {formatDate(viewingClient.created_at)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {viewingClient.address || "Not provided"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingClient?.name}" ({deletingClient?.x_number})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
