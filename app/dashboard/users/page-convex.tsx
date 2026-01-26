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
  UserCheck, 
  UserX, 
  Shield, 
  Users, 
  Eye, 
  EyeOff,
  MoreVertical,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight
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

interface User {
  _id: Id<"users">;
  name: string;
  phone: string;
  role: "receptionist" | "admin";
  employee_id?: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

const COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
  "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
  "bg-pink-500", "bg-rose-500"
];

export default function UsersPageConvex() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "receptionist" as "receptionist" | "admin",
    employee_id: "",
    password: "",
  });

  // Convex queries and mutations
  const allUsers = useQuery(api.queries.getUsers, {});
  const createUser = useMutation(api.mutations.createUser);
  const updateUser = useMutation(api.mutations.updateUser);
  const deleteUser = useMutation(api.mutations.deleteUser);
  const toggleUserActive = useMutation(api.mutations.toggleUserActive);

  const loading = allUsers === undefined;
  const error = allUsers === null;

  // Filter users
  const filteredUsers = allUsers?.filter((user) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (!user.name.toLowerCase().includes(search) &&
          !user.employee_id?.toLowerCase().includes(search) &&
          !user.phone.includes(search)) {
            return false;
      }
    }
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (statusFilter !== "all") {
        if (statusFilter === "active" && !user.is_active) return false;
        if (statusFilter === "inactive" && user.is_active) return false;
    }
    return true;
  }) || [];

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Helper functions
  const getRandomColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(paginatedUsers.map(u => u._id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedUsers(newSelected);
  };

  // CRUD
  const handleAddUser = async () => {
    try {
      if (!formData.name || !formData.phone || !formData.employee_id) {
        toast.error("Required fields missing");
        return;
      }
      await createUser({
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        employee_id: formData.employee_id,
        password_hash: formData.password || undefined,
      });
      toast.success("User created");
      setIsAddSheetOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleEditUser = async () => {
    try {
      if (!editingUser) return;
      await updateUser({
        id: editingUser._id,
        name: formData.name,
        phone: formData.phone,
        employee_id: formData.employee_id || undefined,
        password_hash: formData.password || undefined,
      });
      toast.success("User updated");
      setIsEditSheetOpen(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    try {
      if (!deletingUser) return;
      await deleteUser({ id: deletingUser._id });
      toast.success("User deleted");
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await toggleUserActive({ id: user._id });
      toast.success(`User ${user.is_active ? "deactivated" : "activated"}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      role: user.role,
      employee_id: user.employee_id || "",
      password: "",
    });
    setIsEditSheetOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      role: "receptionist",
      employee_id: "",
      password: "",
    });
  };

  // Stats
  const activeUsers = allUsers?.filter((u) => u.is_active).length || 0;
  const adminUsers = allUsers?.filter((u) => u.role === "admin").length || 0;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground">Manage system access and employee records.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
        </div>
      </div>

       {/* Stats Cards */}
       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{adminUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search staff..." 
                    className="pl-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
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

      {/* Users Table */}
      <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[40px]">
                        <Checkbox 
                            checked={paginatedUsers.length > 0 && selectedUsers.size === paginatedUsers.length}
                            onCheckedChange={handleSelectAll}
                        />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                )}
                {!loading && paginatedUsers.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
                )}
                {paginatedUsers.map((user) => (
                    <TableRow key={user._id} className="hover:bg-muted/50">
                        <TableCell>
                            <Checkbox 
                                checked={selectedUsers.has(user._id)}
                                onCheckedChange={(checked) => handleSelectOne(user._id, !!checked)}
                            />
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className={`${getRandomColor(user.name)} text-white text-xs`}>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{user.name}</span>
                                    <span className="text-xs text-muted-foreground font-mono">{user.employee_id || "N/A"}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={user.role === 'admin' ? "border-purple-200 text-purple-700 bg-purple-50" : "border-blue-200 text-blue-700 bg-blue-50"}>
                                {user.role}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm">{user.phone}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={user.is_active ? "outline" : "secondary"} className={user.is_active ? "border-green-500 text-green-600" : ""}>
                                {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openEdit(user)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                        {user.is_active ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                        {user.is_active ? "Deactivate" : "Activate"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => { setDeletingUser(user); setIsDeleteDialogOpen(true); }}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Account
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
                    {selectedUsers.size > 0 ? `${selectedUsers.size} selected` : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredUsers.length)} of ${filteredUsers.length}`}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
            </div>
      </Card>

      {/* Add User Sheet */}
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add New User</SheetTitle>
            <SheetDescription>Create a new staff account.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+233..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="empid">Employee ID</Label>
              <Input id="empid" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} placeholder="EMP..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(v: "admin" | "receptionist") => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    placeholder="Set initial password"
                />
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-8 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleAddUser}>Create Account</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit User Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit User</SheetTitle>
            <SheetDescription>Update staff information.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-empid">Employee ID</Label>
              <Input id="edit-empid" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">New Password</Label>
              <Input 
                 id="edit-password"
                 type="password" 
                 value={formData.password} 
                 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                 placeholder="Leave empty to keep current" 
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleEditUser}>Update Account</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
             <Button variant="destructive" onClick={handleDeleteUser}>Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
