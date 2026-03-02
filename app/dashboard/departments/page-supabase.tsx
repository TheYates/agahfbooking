"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAllDepartments, useAllDoctors } from "@/hooks/use-hospital-queries";

interface Department {
  id: number;
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
  slot_duration_minutes?: number;
  require_review?: boolean;
  auto_confirm_staff_bookings?: boolean;
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

type DepartmentCreateInput = {
  name: string;
  description?: string;
  slots_per_day: number;
  working_days: string[];
  working_hours: { start: string; end: string };
  color: string;
  slot_duration_minutes: number;
  require_review: boolean;
  auto_confirm_staff_bookings: boolean;
};

type DepartmentUpdateInput = Partial<DepartmentCreateInput> & {
  name?: string;
  is_active?: boolean;
};

async function apiCreateDepartment(input: DepartmentCreateInput) {
  const res = await fetch("/api/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Failed to create department");
  }
  return json.data as Department;
}

async function apiUpdateDepartment(id: number, input: DepartmentUpdateInput) {
  const res = await fetch(`/api/departments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Failed to update department");
  }
  return json.data as Department;
}

async function apiDeleteDepartment(id: number) {
  const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Failed to delete department");
  }
  return true;
}

export default function DepartmentsPageSupabase() {
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<DepartmentCreateInput>({
    name: "",
    description: "",
    slots_per_day: 10,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "09:00", end: "17:00" },
    color: DEPARTMENT_COLORS[0],
    slot_duration_minutes: 30,
    require_review: true,
    auto_confirm_staff_bookings: false,
  });

  // Auto-calculate slots_per_day based on working hours and slot duration
  const calculatedSlotsPerDay = useMemo(() => {
    const { start, end } = formData.working_hours;
    const duration = formData.slot_duration_minutes;

    const startParts = start.split(":");
    const endParts = end.split(":");
    const startMinutes =
      parseInt(startParts[0]) * 60 + parseInt(startParts[1] || "0");
    const endMinutes =
      parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
    const totalMinutes = endMinutes - startMinutes;

    return Math.floor(totalMinutes / duration);
  }, [formData.working_hours, formData.slot_duration_minutes]);

  const departmentsQuery = useAllDepartments();
  const doctorsQuery = useAllDoctors();

  const departments = (departmentsQuery.data || []) as Department[];
  const doctors = doctorsQuery.data || [];

  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(q));
  }, [departments, searchQuery]);

  const getDoctorCount = (departmentId: number) => {
    return doctors.filter((doc) => doc.department_id === departmentId).length;
  };

  const createMutation = useMutation({
    mutationFn: apiCreateDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create department");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: DepartmentUpdateInput }) =>
      apiUpdateDepartment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update department");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingDepartment(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete department");
    },
  });

  const handleAddDepartment = async () => {
    if (!formData.name) {
      toast.error("Department name is required");
      return;
    }
    createMutation.mutate({
      ...formData,
      slots_per_day: calculatedSlotsPerDay,
    });
  };

  const handleEditDepartment = async () => {
    if (!editingDepartment) return;
    if (!formData.name) {
      toast.error("Department name is required");
      return;
    }

    updateMutation.mutate({
      id: editingDepartment.id,
      input: {
        ...formData,
        slots_per_day: calculatedSlotsPerDay,
      },
    });
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDepartment) return;
    deleteMutation.mutate(deletingDepartment.id);
  };

  const handleToggleActive = async (department: Department) => {
    updateMutation.mutate({
      id: department.id,
      input: { is_active: !department.is_active },
    });
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
      slot_duration_minutes: department.slot_duration_minutes ?? 30,
      require_review: department.require_review ?? true,
      auto_confirm_staff_bookings:
        department.auto_confirm_staff_bookings ?? false,
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
      slot_duration_minutes: 30,
      require_review: true,
      auto_confirm_staff_bookings: false,
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

  const loading = departmentsQuery.isLoading;

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
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center h-24 text-muted-foreground"
                    >
                      No departments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments?.map((dept, index) => {
                    // Calculate slots for display
                    const startParts = dept.working_hours.start.split(":");
                    const endParts = dept.working_hours.end.split(":");
                    const startMinutes =
                      parseInt(startParts[0]) * 60 +
                      parseInt(startParts[1] || "0");
                    const endMinutes =
                      parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
                    const totalMinutes = endMinutes - startMinutes;
                    const calculatedSlots = Math.floor(
                      totalMinutes / (dept.slot_duration_minutes || 30),
                    );

                    return (
                      <TableRow
                        key={dept.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openEditDialog(dept)}
                      >
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
                              {formatTime(dept.working_hours.start)} -{" "}
                              {formatTime(dept.working_hours.end)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dept.working_days.length} days / week
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              {calculatedSlots}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              slots/day
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              {dept.slot_duration_minutes || 30}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              mins
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(dept)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(dept)}
                              >
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Department Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Configure the new department's schedule and details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label htmlFor="name" className="text-xs">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Cardiology"
                  className="h-8 mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) =>
                    setFormData({ ...formData, color: value })
                  }
                >
                  <SelectTrigger className="h-8 mt-1 w-full">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-mono text-xs">{color}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="start-time" className="text-xs">
                  Start Time
                </Label>
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
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-time" className="text-xs">
                  End Time
                </Label>
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
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="slot-duration" className="text-xs">
                  Duration (min)
                </Label>
                <Input
                  id="slot-duration"
                  type="number"
                  min="5"
                  max="120"
                  value={formData.slot_duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slot_duration_minutes: parseInt(e.target.value) || 30,
                    })
                  }
                  className="h-8 mt-1"
                />
              </div>
            </div>

            {/* Compact Calculated Info */}
            <div className="flex items-center justify-between bg-muted/40 p-2 rounded text-xs border">
              <div className="flex gap-2">
                <span>
                  Capacity:{" "}
                  <span className="font-semibold">{calculatedSlotsPerDay}</span>{" "}
                  slots/day
                </span>
              </div>
              <span className="text-muted-foreground">
                {formData.working_days.length} days/week
              </span>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">Working Days</Label>
              <div className="flex justify-between gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.id}
                    className={`flex items-center justify-center w-8 h-8 rounded-md border cursor-pointer transition-colors text-[10px] font-medium uppercase ${
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
                    {day.label.slice(0, 1)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-xs">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description"
                rows={2}
                className="min-h-[50px] mt-1 text-sm resize-none"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center space-x-2">
                <Switch
                  id="require-review"
                  checked={formData.require_review}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, require_review: checked })
                  }
                  className="scale-75 origin-left"
                />
                <Label
                  htmlFor="require-review"
                  className="text-xs cursor-pointer"
                >
                  Require Review
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-confirm-staff"
                  checked={formData.auto_confirm_staff_bookings}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      auto_confirm_staff_bookings: checked,
                    })
                  }
                  className="scale-75 origin-left"
                />
                <Label
                  htmlFor="auto-confirm-staff"
                  className="text-xs cursor-pointer"
                >
                  Auto-confirm Staff
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddDepartment}
              disabled={createMutation.isPending}
            >
              Create Department
            </Button>
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
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label htmlFor="edit-name" className="text-xs">
                  Name *
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-8 mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) =>
                    setFormData({ ...formData, color: value })
                  }
                >
                  <SelectTrigger className="h-8 mt-1 w-full">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-mono text-xs">{color}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="edit-start" className="text-xs">
                  Start Time
                </Label>
                <Input
                  id="edit-start"
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
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-end" className="text-xs">
                  End Time
                </Label>
                <Input
                  id="edit-end"
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
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-duration" className="text-xs">
                  Duration (min)
                </Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="5"
                  max="120"
                  value={formData.slot_duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slot_duration_minutes: parseInt(e.target.value) || 30,
                    })
                  }
                  className="h-8 mt-1"
                />
              </div>
            </div>

            {/* Compact Calculated Info */}
            <div className="flex items-center justify-between bg-muted/40 p-2 rounded text-xs border">
              <div className="flex gap-2">
                <span>
                  Capacity:{" "}
                  <span className="font-semibold">{calculatedSlotsPerDay}</span>{" "}
                  slots/day
                </span>
              </div>
              <span className="text-muted-foreground">
                {formData.working_days.length} days/week
              </span>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">Working Days</Label>
              <div className="flex justify-between gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.id}
                    className={`flex items-center justify-center w-8 h-8 rounded-md border cursor-pointer transition-colors text-[10px] font-medium uppercase ${
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
                    {day.label.slice(0, 1)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-xs">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                className="min-h-[50px] mt-1 text-sm resize-none"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-require-review"
                  checked={formData.require_review}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, require_review: checked })
                  }
                  className="scale-75 origin-left"
                />
                <Label
                  htmlFor="edit-require-review"
                  className="text-xs cursor-pointer"
                >
                  Require Review
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-auto-confirm-staff"
                  checked={formData.auto_confirm_staff_bookings}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      auto_confirm_staff_bookings: checked,
                    })
                  }
                  className="scale-75 origin-left"
                />
                <Label
                  htmlFor="edit-auto-confirm-staff"
                  className="text-xs cursor-pointer"
                >
                  Auto-confirm Staff
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEditDepartment}
              disabled={updateMutation.isPending}
            >
              Update Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingDepartment?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
              disabled={deleteMutation.isPending}
            >
              Delete Department
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
