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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Users, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
}

const CATEGORIES = [
  "PRIVATE CASH",
  "PUBLIC SPONSORED(NHIA)",
  "PRIVATE SPONSORED",
  "PRIVATE DEPENDENT",
];

const COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

export default function ClientsPageConvex() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("joinDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

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

  // Filter, sort
  const filteredClients = allClients?.filter((client) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesSearch = 
        client.name.toLowerCase().includes(search) ||
        client.x_number.toLowerCase().includes(search) ||
        client.phone.includes(search);
      if (!matchesSearch) return false;
    }

    if (categoryFilter !== "all" && client.category !== categoryFilter) {
      return false;
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active" && !client.is_active) return false;
      if (statusFilter === "inactive" && client.is_active) return false;
    }

    return true;
  }) || [];

  const sortedClients = [...filteredClients].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case "xNumber": aVal = a.x_number; bVal = b.x_number; break;
      case "name": aVal = a.name; bVal = b.name; break;
      case "phone": aVal = a.phone; bVal = b.phone; break;
      case "category": aVal = a.category; bVal = b.category; break;
      case "status": aVal = a.is_active ? 1 : 0; bVal = b.is_active ? 1 : 0; break;
      case "joinDate": aVal = a.created_at; bVal = b.created_at; break;
      default: aVal = a.created_at; bVal = b.created_at;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = sortedClients.slice(startIndex, endIndex);

  // Handlers
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(paginatedClients.map(c => c._id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedClients);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedClients(newSelected);
  };

  const getRandomColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getCategoryBadgeColor = (category: string) => {
     switch(category) {
        case "PRIVATE CASH": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "PUBLIC SPONSORED(NHIA)": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "PRIVATE SPONSORED": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        case "PRIVATE DEPENDENT": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
        default: return "bg-gray-100 text-gray-800";
     }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // CRUD Handlers
  const handleAddClient = async () => {
    try {
      if (!formData.x_number || !formData.name || !formData.phone || !formData.category) {
        toast.error("Required fields missing");
        return;
      }
      // Simple format check visually handled by UI hint, but validation is good
      if (!/^X\d{5}\/\d{2}$/.test(formData.x_number)) { 
          toast.error("Invalid X-Number format"); return; 
      }

      await createClient({
        ...formData,
        emergency_contact: formData.emergency_contact || undefined,
        address: formData.address || undefined,
      });

      toast.success("Client added");
      setIsAddSheetOpen(false);
      resetForm();
    } catch (e) {
      toast.error("Failed to add client");
    }
  };

  const handleEditClient = async () => {
      if (!editingClient) return;
      try {
          await updateClient({
              id: editingClient._id,
              name: formData.name,
              phone: formData.phone,
              category: formData.category,
              emergency_contact: formData.emergency_contact || undefined,
              address: formData.address || undefined,
          });
          toast.success("Client updated");
          setIsEditSheetOpen(false);
          setEditingClient(null);
          resetForm();
      } catch (e) {
          toast.error("Failed to update client");
      }
  };

  const handleDeleteClient = async () => {
    if(!deletingClient) return;
    try {
        await deleteClient({ id: deletingClient._id });
        toast.success("Client deleted");
        setIsDeleteDialogOpen(false);
        setDeletingClient(null);
    } catch(e) {
        toast.error("Failed to delete");
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
        x_number: client.x_number,
        name: client.name,
        phone: client.phone,
        category: client.category,
        emergency_contact: client.emergency_contact || "",
        address: client.address || "",
    });
    setIsEditSheetOpen(true);
  };

  const openView = (client: Client) => {
    setViewingClient(client);
    setIsViewSheetOpen(true);
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

  return (
    <div className="h-full flex flex-col space-y-6">
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Client Directory</h1>
                <p className="text-muted-foreground">Manage patient records, admissions, and history.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
                <Button onClick={() => setIsAddSheetOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
            </div>
        </div>

        {/* Filters & Search Toolbar */}
        <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search clients..." 
                        className="pl-9" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="overflow-auto flex-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox 
                                    checked={paginatedClients.length > 0 && selectedClients.size === paginatedClients.length}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("xNumber")}>
                                <div className="flex items-center gap-1">X-Number {sortBy === "xNumber" && <ChevronDown className="h-3 w-3" />}</div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                                <div className="flex items-center gap-1">Client {sortBy === "name" && <ChevronDown className="h-3 w-3" />}</div>
                            </TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow>}
                        {!loading && paginatedClients.length === 0 && (
                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No clients found.</TableCell></TableRow>
                        )}
                        {paginatedClients.map((client) => (
                            <TableRow key={client._id} className="hover:bg-muted/50">
                                <TableCell>
                                    <Checkbox 
                                        checked={selectedClients.has(client._id)}
                                        onCheckedChange={(checked) => handleSelectOne(client._id, !!checked)}
                                    />
                                </TableCell>
                                <TableCell className="font-mono text-xs">{client.x_number}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className={`${getRandomColor(client.name)} text-white text-xs`}>
                                                {getInitials(client.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{client.name}</span>
                                            <span className="text-xs text-muted-foreground">Joined {formatDate(client.created_at)}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">{client.phone}</div>
                                    {client.emergency_contact && <div className="text-xs text-muted-foreground">Emerg: {client.emergency_contact}</div>}
                                </TableCell>
                                <TableCell>
                                    <Badge className={`${getCategoryBadgeColor(client.category)} hover:opacity-90`}>
                                        {client.category}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={client.is_active ? "outline" : "secondary"} className={client.is_active ? "border-green-500 text-green-600" : ""}>
                                        {client.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => openView(client)}>
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openEdit(client)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Record
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={() => { setDeletingClient(client); setIsDeleteDialogOpen(true); }}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {selectedClients.size > 0 ? `${selectedClients.size} selected` : `Showing ${startIndex + 1}-${Math.min(endIndex, sortedClients.length)} of ${sortedClients.length}`}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
            </div>
        </Card>

        {/* Add Sheet */}
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>New Client</SheetTitle>
                    <SheetDescription>Register a new patient into the system.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="x-number">X-Number</Label>
                        <Input id="x-number" value={formData.x_number} onChange={e => setFormData({...formData, x_number: e.target.value})} placeholder="X00000/00" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+233..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="emergency">Emergency Contact</Label>
                         <Input id="emergency" value={formData.emergency_contact} onChange={e => setFormData({...formData, emergency_contact: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="address">Address</Label>
                         <Textarea id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                </div>
                <SheetFooter>
                    <Button onClick={handleAddClient}>Save Client</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>

        {/* Edit Sheet */}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Client</SheetTitle>
                    <SheetDescription>Update patient information.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>X-Number</Label>
                        <Input value={formData.x_number} disabled className="bg-muted" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input id="edit-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input id="edit-phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-category">Category</Label>
                        <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="edit-emergency">Emergency Contact</Label>
                         <Input id="edit-emergency" value={formData.emergency_contact} onChange={e => setFormData({...formData, emergency_contact: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="edit-address">Address</Label>
                         <Textarea id="edit-address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                </div>
                <SheetFooter>
                    <Button onClick={handleEditClient}>Update Record</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>

        {/* View Sheet */}
        <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Client Profile</SheetTitle>
                    <SheetDescription>Detailed view of patient record.</SheetDescription>
                </SheetHeader>
                {viewingClient && (
                    <div className="py-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className={`${getRandomColor(viewingClient.name)} text-white text-xl`}>
                                    {getInitials(viewingClient.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="text-xl font-bold">{viewingClient.name}</div>
                                <div className="text-muted-foreground font-mono">{viewingClient.x_number}</div>
                                <Badge className="mt-2" variant={viewingClient.is_active ? "outline" : "secondary"}>
                                    {viewingClient.is_active ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid gap-4 border-t pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Phone</Label>
                                    <div className="font-medium">{viewingClient.phone}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Joined</Label>
                                    <div className="font-medium">{formatDate(viewingClient.created_at)}</div>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Category</Label>
                                <div className="mt-1"><Badge>{viewingClient.category}</Badge></div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Emergency Contact</Label>
                                <div className="font-medium">{viewingClient.emergency_contact || "N/A"}</div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Address</Label>
                                <div className="font-medium">{viewingClient.address || "N/A"}</div>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Client</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete {deletingClient?.name}? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteClient}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
