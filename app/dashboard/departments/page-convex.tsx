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
import { Plus, Edit, Trash2, Building2, Stethoscope } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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

interface Doctor {
  _id: Id<"users">;
  name: string;
  department_id: Id<"departments">;
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
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [isAddDoctorDialogOpen, setIsAddDoctorDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slots_per_day: 10,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "09:00", end: "17:00" },
    color: DEPARTMENT_COLORS[0],
  });

  const [doctorFormData, setDoctorFormData] = useState({
    name: "",
    department_id: "" as Id<"departments"> | "",
  });

  // Convex queries and mutations
  const departments = useQuery(api.queries.getDepartments, {});
  const doctors = useQuery(api.queries.staff.getAllActive, {});
  const createDepartment = useMutation(api.mutations.createDepartment);
  const updateDepartment = useMutation(api.mutations.updateDepartment);
  const deleteDepartment = useMutation(api.mutations.deleteDepartment);

  const loading = departments === undefined;
  const error = departments === null;

  // Get doctor count for a department
  const getDoctorCount = (departmentId: Id<"departments">) => {
    if (!doctors) return 0;
    return doctors.filter((doctor: any) => doctor.department_id === departmentId).length;
  };

  // Get filtered doctors for selected department
  const getFilteredDoctors = () => {
    if (!selectedDepartment || !doctors) return [];
    return doctors.filter((doctor: any) => doctor.department_id === selectedDepartment._id);
  };

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
        `Department ${department.is_active ? "deactivated" : "activated"} successfully`
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

  const handleEditDept = (department: Department) => {
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

  const handleDeleteDept = async (id: Id<"departments">) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    
    try {
      await deleteDepartment({ id });
      toast.success("Department deleted successfully");
      if (selectedDepartment?._id === id) {
        setSelectedDepartment(null);
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Failed to delete department");
    }
  };

  const handleAddDoctor = () => {
    if (!selectedDepartment) return;
    setDoctorFormData({
      name: "",
      department_id: selectedDepartment._id,
    });
    setIsAddDoctorDialogOpen(true);
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Doctor creation functionality to be implemented with user creation");
    setIsAddDoctorDialogOpen(false);
    resetDoctorForm();
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

  const resetDoctorForm = () => {
    setDoctorFormData({
      name: "",
      department_id: "",
    });
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDepartment) {
      await handleEditDepartment();
    } else {
      await handleAddDepartment();
    }
  };

  const handleWorkingDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">
            Manage hospital departments and their schedules
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  All Departments
                </CardTitle>
                <CardDescription>
                  Select a department to view details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {departments?.map((department: any) => (
                  <div
                    key={department._id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDepartment?._id === department._id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedDepartment(department)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: department.color }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{department.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {department.slots_per_day} slots/day
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getDoctorCount(department._id)} doctors
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDept(department);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDept(department._id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {departments?.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No departments found</p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Department
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Department Details */}
          <div className="lg:col-span-2">
            {selectedDepartment ? (
              <div className="space-y-6">
                {/* Department Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: selectedDepartment.color }}
                        />
                        <div>
                          <CardTitle>{selectedDepartment.name}</CardTitle>
                          <CardDescription>
                            {selectedDepartment.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleEditDept(selectedDepartment)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Department
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Slots Per Day
                        </Label>
                        <p className="text-2xl font-bold">
                          {selectedDepartment.slots_per_day}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Working Hours
                        </Label>
                        <p className="text-lg font-semibold">
                          {selectedDepartment.working_hours.start} -{" "}
                          {selectedDepartment.working_hours.end}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Working Days
                        </Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedDepartment.working_days.map((day) => (
                            <Badge
                              key={day}
                              variant="secondary"
                              className="text-xs"
                            >
                              {DAYS_OF_WEEK.find((d) => d.id === day)?.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Assigned Doctors
                        </Label>
                        <p className="text-2xl font-bold">
                          {getDoctorCount(selectedDepartment._id)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Doctors List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Doctors in {selectedDepartment.name}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddDoctor}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Doctor
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getFilteredDoctors().length > 0 ? (
                      <div className="space-y-2">
                        {getFilteredDoctors().map((doctor: any) => (
                          <div
                            key={doctor._id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Stethoscope className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{doctor.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {doctor.role || "Doctor"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No doctors assigned to this department yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={handleAddDoctor}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Doctor
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-xl font-medium text-muted-foreground mb-2">
                    No Department Selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Select a department from the list to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day.id} className="flex items-center space-x-2">
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
              <div className="flex gap-2 mt-2">
                {DEPARTMENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color
                        ? "border-black scale-110"
                        : "border-transparent"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department details and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start-time">Start Time *</Label>
                <Input
                  id="edit-start-time"
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
                <Label htmlFor="edit-end-time">End Time *</Label>
                <Input
                  id="edit-end-time"
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
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day.id} className="flex items-center space-x-2">
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
              <div className="flex gap-2 mt-2">
                {DEPARTMENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color
                        ? "border-black scale-110"
                        : "border-transparent"
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
              Are you sure you want to delete "{deletingDepartment?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDepartment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Doctor Dialog */}
      <Dialog
        open={isAddDoctorDialogOpen}
        onOpenChange={setIsAddDoctorDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>
              Add a new doctor to {selectedDepartment?.name} department.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDoctorSubmit} className="space-y-4">
            <div>
              <Label htmlFor="doctor-name">Doctor Name</Label>
              <Input
                id="doctor-name"
                value={doctorFormData.name}
                onChange={(e) =>
                  setDoctorFormData({ ...doctorFormData, name: e.target.value })
                }
                placeholder="Enter doctor's full name"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDoctorDialogOpen(false);
                  resetDoctorForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Doctor</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
