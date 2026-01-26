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
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
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

interface Department {
  _id: Id<"departments">;
  name: string;
  description?: string;
  slots_per_day: number;
  working_days: string[];
  working_hours: {
    start: string;
    end: string;
  };
  color: string;
  is_active: boolean;
  created_at: number;
}

const DAYS_OF_WEEK = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
];

const DEPARTMENT_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#84CC16",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#10B981",
];

export default function DepartmentsPageConvex() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slots_per_day: 10,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "09:00", end: "17:00" },
    color: DEPARTMENT_COLORS[0],
  });

  // Convex queries and mutations
  const departments = useQuery(api.queries.getDepartments, {});
  const doctors = useQuery(api.queries.staff.getAllActive, {});
  const createDepartment = useMutation(api.mutations.createDepartment);
  const updateDepartment = useMutation(api.mutations.updateDepartment);
  const deleteDepartment = useMutation(api.mutations.deleteDepartment);

  const loading = departments === undefined;

  // Get doctor count for a department
  const getDoctorCount = (departmentId: Id<"departments">) => {
    if (!doctors) return 0;
    return doctors.filter((doctor: any) => doctor.department_id === departmentId).length;
  };

  const filteredDepartments = departments?.filter((dept: Department) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDepartment = async () => {
    try {
      if (!formData.name) {
        toast.error("Department name is required");
        return;
      }

      await createDepartment({
        name: formData.name,
        description: formData.description || undefined,
        slots_per_day: formData.slots_per_day,
        working_days: formData.working_days,
        working_hours: formData.working_hours,
        color: formData.color,
      });

      toast.success("Department created successfully");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create department");
    }
  };

  const handleEditDepartment = async () => {
    try {
      if (!editingDepartment || !formData.name) {
        toast.error("Department name is required");
        return;
      }

      await updateDepartment({
        id: editingDepartment._id,
        name: formData.name,
        description: formData.description || undefined,
        slots_per_day: formData.slots_per_day,
        working_days: formData.working_days,
        working_hours: formData.working_hours,
        color: formData.color,
      });

      toast.success("Department updated successfully");
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
      resetForm();
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update department");
    }
  };

  const handleDeleteDepartment = async () => {
    try {
      if (!deletingDepartment) return;

      await deleteDepartment({ id: deletingDepartment._id });

      toast.success("Department deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingDepartment(null);
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete department");
    }
  };

  const handleToggleActive = async (department: Department) => {
    try {
      await updateDepartment({
        id: department._id,
        is_active: !department.is_active,
      });

      toast.success(
        `Department ${!department.is_active ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error toggling department active status:", error);
      toast.error("Failed to update department status");
    }
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      slots_per_day: department.slots_per_day,
      working_days: department.working_days,
      working_hours: department.working_hours,
      color: department.color,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (department: Department) => {
    setDeletingDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      slots_per_day: 10,
      working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      working_hours: { start: "09:00", end: "17:00" },
      color: DEPARTMENT_COLORS[0],
    });
  };

  const handleWorkingDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day],
    }));
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${suffix}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage hospital departments, schedules, and capacities.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Department List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          <CardDescription>
            View and manage all registered departments in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading departments...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      No departments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments?.map((dept: Department, index: number) => (
                    <TableRow key={dept._id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: dept.color }}
                          />
                          <div>
                            <div className="font-medium">{dept.name}</div>
                            {dept.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {dept.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={dept.is_active ? "default" : "secondary"}
                          className={
                            dept.is_active
                              ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200"
                          }
                        >
                          {dept.is_active ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Inactive
                            </div>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {formatTime(dept.working_hours.start)} - {formatTime(dept.working_hours.end)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dept.working_days.length} days / week
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{dept.slots_per_day}</span>
                          <span className="text-muted-foreground text-xs">slots/day</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1">
                            <span className="font-medium">{getDoctorCount(dept._id)}</span>
                            <span className="text-muted-foreground text-xs">doctors</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(dept)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(dept)}>
                              {dept.is_active ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4 text-yellow-600" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => openDeleteDialog(dept)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Department Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Create a new department with working schedule and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cardiology"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the department"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="slots">Slots per Day *</Label>
              <Input
                id="slots"
                type="number"
                min="1"
                value={formData.slots_per_day}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slots_per_day: parseInt(e.target.value) || 20,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time *</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={formData.working_hours.start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_hours: {
                        ...formData.working_hours,
                        start: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time *</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={formData.working_hours.end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_hours: {
                        ...formData.working_hours,
                        end: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Working Days *</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day.id} className="flex items-center space-x-2 border p-2 rounded cursor-pointer hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={formData.working_days.includes(day.id)}
                      onChange={() => handleWorkingDayToggle(day.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Department Color</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {DEPARTMENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      formData.color === color
                        ? "border-black scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDepartment}>Create Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department details and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-slots">Slots per Day *</Label>
              <Input
                id="edit-slots"
                type="number"
                min="1"
                value={formData.slots_per_day}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slots_per_day: parseInt(e.target.value) || 20,
                  })
                }
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
               <Label>Working Hours *</Label>
               <div className="flex items-center gap-2 mt-1">
                <Input
                  type="time"
                  value={formData.working_hours.start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_hours: {
                        ...formData.working_hours,
                        start: e.target.value,
                      },
                    })
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={formData.working_hours.end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_hours: {
                        ...formData.working_hours,
                        end: e.target.value,
                      },
                    })
                  }
                  className="flex-1"
                />
               </div>
            </div>
            <div className="col-span-2">
              <Label>Working Days *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day.id} 
                    className={`flex items-center justify-center w-8 h-8 rounded-full border cursor-pointer transition-colors text-xs font-medium ${
                      formData.working_days.includes(day.id)
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.working_days.includes(day.id)}
                      onChange={() => handleWorkingDayToggle(day.id)}
                      className="hidden"
                    />
                    {day.label.charAt(0)}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <Label>Color</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {DEPARTMENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      formData.color === color
                        ? "border-black scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDepartment}>Update Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deletingDepartment?.name}</span>? 
              This action cannot be undone and may affect assigned doctors and appointments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
             <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
             <Button variant="destructive" onClick={handleDeleteDepartment}>Delete Department</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

