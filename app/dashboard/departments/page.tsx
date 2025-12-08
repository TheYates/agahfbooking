"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Building2, Stethoscope } from "lucide-react";

// 🚀 Import TanStack Query hooks
import {
  useAllDepartments,
  useAllDoctors,
  useAddDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useAddDoctor,
  useDeleteDoctor,
} from "@/hooks/use-hospital-queries";

interface Department {
  id: number;
  name: string;
  description: string;
  slots_per_day: number;
  working_days: string[];
  working_hours: { start: string; end: string };
  color: string;
  is_active: boolean;
}

interface Doctor {
  id: number;
  name: string;
  department_id: number;
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

// Helper function to convert 24-hour time to 12-hour format
function formatTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

export default function DepartmentsPage() {
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  // Dialog states
  const [isAddDeptDialogOpen, setIsAddDeptDialogOpen] = useState(false);
  const [isEditDeptDialogOpen, setIsEditDeptDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [isAddDoctorDialogOpen, setIsAddDoctorDialogOpen] = useState(false);
  const [isDeleteDoctorDialogOpen, setIsDeleteDoctorDialogOpen] = useState(false);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);

  // Form data
  const [deptFormData, setDeptFormData] = useState({
    name: "",
    description: "",
    slots_per_day: 10,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "09:00", end: "17:00" },
    color: DEPARTMENT_COLORS[0],
  });

  const [doctorFormData, setDoctorFormData] = useState({
    name: "",
    department_id: 0,
  });

  // 🚀 TanStack Query: Replace fetchDepartments/fetchDoctors useEffect with hooks!
  const {
    data: departments,
    isLoading: departmentsLoading,
    error: departmentsError,
    isRefetching: departmentsRefetching,
  } = useAllDepartments();

  const {
    data: doctors,
    isLoading: doctorsLoading,
    error: doctorsError,
    isRefetching: doctorsRefetching,
  } = useAllDoctors();

  // 🚀 TanStack Query: Mutations with optimistic updates
  const addDeptMutation = useAddDepartment();
  const updateDeptMutation = useUpdateDepartment();
  const deleteDeptMutation = useDeleteDepartment();
  const addDoctorMutation = useAddDoctor();
  const deleteDoctorMutation = useDeleteDoctor();

  // Extract data with safe defaults
  const departmentsList = departments || [];
  const doctorsList = doctors || [];
  const loading = departmentsLoading || doctorsLoading;
  const error = departmentsError || doctorsError;

  // Get doctor count for a department
  const getDoctorCount = (departmentId: number) => {
    return doctorsList.filter((doctor) => doctor.department_id === departmentId)
      .length;
  };

  // Get filtered doctors for selected department
  const getFilteredDoctors = () => {
    if (!selectedDepartment) return [];
    return doctorsList.filter(
      (doctor) => doctor.department_id === selectedDepartment.id
    );
  };

  // Handle department form submission
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDepartment) {
      // 🚀 TanStack Query: Update with optimistic updates
      updateDeptMutation.mutate(
        { id: editingDepartment.id, data: deptFormData },
        {
          onSuccess: () => {
            resetDeptForm();
            setIsEditDeptDialogOpen(false);
          },
        }
      );
    } else {
      // 🚀 TanStack Query: Create
      addDeptMutation.mutate(deptFormData, {
        onSuccess: () => {
          resetDeptForm();
          setIsAddDeptDialogOpen(false);
        },
      });
    }
  };

  const resetDeptForm = () => {
    setDeptFormData({
      name: "",
      description: "",
      slots_per_day: 10,
      working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      working_hours: { start: "09:00", end: "17:00" },
      color: DEPARTMENT_COLORS[0],
    });
    setEditingDepartment(null);
  };

  // Handle doctor form submission
  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartment) {
      return;
    }

    // 🚀 TanStack Query: Use mutation hook
    addDoctorMutation.mutate(
      {
        ...doctorFormData,
        department_id: selectedDepartment.id,
      },
      {
        onSuccess: () => {
          resetDoctorForm();
          setIsAddDoctorDialogOpen(false);
        },
      }
    );
  };

  const resetDoctorForm = () => {
    setDoctorFormData({
      name: "",
      department_id: 0,
    });
  };

  const handleAddDoctor = () => {
    if (!selectedDepartment) {
      return;
    }
    resetDoctorForm();
    setIsAddDoctorDialogOpen(true);
  };

  const handleDeleteDoctor = (doctor: Doctor) => {
    setDeletingDoctor(doctor);
    setIsDeleteDoctorDialogOpen(true);
  };

  const confirmDeleteDoctor = () => {
    if (!deletingDoctor) return;
    deleteDoctorMutation.mutate(deletingDoctor.id);
    setIsDeleteDoctorDialogOpen(false);
    setDeletingDoctor(null);
  };

  const handleEditDept = (department: Department) => {
    setDeptFormData({
      name: department.name,
      description: department.description,
      slots_per_day: department.slots_per_day,
      working_days: department.working_days,
      working_hours: department.working_hours,
      color: department.color,
    });
    setEditingDepartment(department);
    setIsEditDeptDialogOpen(true);
  };

  const handleDeleteDept = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) {
      return;
    }

    // 🚀 TanStack Query: Use mutation hook with optimistic updates
    deleteDeptMutation.mutate(id, {
      onSuccess: () => {
        if (selectedDepartment?.id === id) {
          setSelectedDepartment(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments & Doctors</h1>
          <p className="text-muted-foreground">
            Manage medical departments, working schedules, and assigned doctors
          </p>
        </div>
        <Button onClick={() => setIsAddDeptDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Loading State */}
      {loading && departmentsList.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Departments List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Departments
                  </CardTitle>
                  <CardDescription>
                    Select a department to view details and manage doctors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {departmentsList.map((department) => (
                    <div
                      key={department.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all border-l-4 ${
                        selectedDepartment?.id === department.id
                          ? "bg-primary/10 border-primary shadow-sm"
                          : "hover:bg-muted/50"
                      }`}
                      style={{ borderLeftColor: department.color }}
                      onClick={() => setSelectedDepartment(department)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: department.color }}
                            />
                            <h4 className="font-medium">{department.name}</h4>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{department.slots_per_day} slots/day</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Stethoscope className="h-3 w-3" />
                              {getDoctorCount(department.id)} doctors
                            </span>
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
                              handleDeleteDept(department.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {departmentsList.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No departments found</p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => setIsAddDeptDialogOpen(true)}
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
                            {formatTo12Hour(selectedDepartment.working_hours.start)} -{" "}
                            {formatTo12Hour(selectedDepartment.working_hours.end)}
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
                            {
                              doctorsList.filter(
                                (d) => d.department_id === selectedDepartment.id
                              ).length
                            }
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
                          {getFilteredDoctors().map((doctor) => (
                            <div
                              key={doctor.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Stethoscope className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{doctor.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedDepartment.name}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDoctor(doctor);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No doctors assigned to this department
                          </p>
                          <Button
                            variant="outline"
                            className="mt-2"
                            onClick={handleAddDoctor}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Doctor
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Select a Department
                    </h3>
                    <p className="text-muted-foreground text-center">
                      Choose a department from the list to view details and manage
                      doctors
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Add Department Dialog */}
          <Dialog open={isAddDeptDialogOpen} onOpenChange={setIsAddDeptDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Create a new medical department with working schedule.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDeptSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Department Name</Label>
                    <Input
                      id="name"
                      value={deptFormData.name}
                      onChange={(e) =>
                        setDeptFormData({ ...deptFormData, name: e.target.value })
                      }
                      placeholder="e.g., Cardiology"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slots_per_day">Slots Per Day</Label>
                    <Input
                      id="slots_per_day"
                      type="number"
                      min="1"
                      max="50"
                      value={deptFormData.slots_per_day}
                      onChange={(e) =>
                        setDeptFormData({
                          ...deptFormData,
                          slots_per_day: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={deptFormData.description}
                    onChange={(e) =>
                      setDeptFormData({
                        ...deptFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of the department"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Department Color</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex gap-2">
                      {DEPARTMENT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${
                            deptFormData.color === color
                              ? "border-gray-900 dark:border-gray-100 scale-110"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setDeptFormData({ ...deptFormData, color })}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="custom-color" className="text-sm text-muted-foreground">
                        Or pick custom:
                      </Label>
                      <input
                        id="custom-color"
                        type="color"
                        value={deptFormData.color}
                        onChange={(e) =>
                          setDeptFormData({ ...deptFormData, color: e.target.value })
                        }
                        className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <span className="text-sm font-mono text-muted-foreground">
                        {deptFormData.color}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={deptFormData.working_hours.start}
                      onChange={(e) =>
                        setDeptFormData({
                          ...deptFormData,
                          working_hours: {
                            ...deptFormData.working_hours,
                            start: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={deptFormData.working_hours.end}
                      onChange={(e) =>
                        setDeptFormData({
                          ...deptFormData,
                          working_hours: {
                            ...deptFormData.working_hours,
                            end: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Working Days</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.id}
                          checked={deptFormData.working_days.includes(day.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDeptFormData({
                                ...deptFormData,
                                working_days: [
                                  ...deptFormData.working_days,
                                  day.id,
                                ],
                              });
                            } else {
                              setDeptFormData({
                                ...deptFormData,
                                working_days: deptFormData.working_days.filter(
                                  (d) => d !== day.id
                                ),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={day.id} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDeptDialogOpen(false);
                      resetDeptForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addDeptMutation.isPending}>
                    {addDeptMutation.isPending ? "Adding..." : "Add Department"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Department Dialog */}
          <Dialog
            open={isEditDeptDialogOpen}
            onOpenChange={setIsEditDeptDialogOpen}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Department</DialogTitle>
                <DialogDescription>
                  Update department information and working schedule.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDeptSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Department Name</Label>
                    <Input
                      id="edit-name"
                      value={deptFormData.name}
                      onChange={(e) =>
                        setDeptFormData({ ...deptFormData, name: e.target.value })
                      }
                      placeholder="e.g., Cardiology"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-slots">Slots Per Day</Label>
                    <Input
                      id="edit-slots"
                      type="number"
                      min="1"
                      max="50"
                      value={deptFormData.slots_per_day}
                      onChange={(e) =>
                        setDeptFormData({
                          ...deptFormData,
                          slots_per_day: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={deptFormData.description}
                    onChange={(e) =>
                      setDeptFormData({
                        ...deptFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of the department"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Department Color</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex gap-2">
                      {DEPARTMENT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${
                            deptFormData.color === color
                              ? "border-gray-900 dark:border-gray-100 scale-110"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setDeptFormData({ ...deptFormData, color })}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="custom-color" className="text-sm text-muted-foreground">
                        Or pick custom:
                      </Label>
                      <input
                        id="custom-color"
                        type="color"
                        value={deptFormData.color}
                        onChange={(e) =>
                          setDeptFormData({ ...deptFormData, color: e.target.value })
                        }
                        className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <span className="text-sm font-mono text-muted-foreground">
                        {deptFormData.color}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={deptFormData.working_hours.start}
                      onChange={(e) =>
                        setDeptFormData({
                          ...deptFormData,
                          working_hours: {
                            ...deptFormData.working_hours,
                            start: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={deptFormData.working_hours.end}
                      onChange={(e) =>
                        setDeptFormData({
                          ...deptFormData,
                          working_hours: {
                            ...deptFormData.working_hours,
                            end: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Working Days</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${day.id}`}
                          checked={deptFormData.working_days.includes(day.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDeptFormData({
                                ...deptFormData,
                                working_days: [
                                  ...deptFormData.working_days,
                                  day.id,
                                ],
                              });
                            } else {
                              setDeptFormData({
                                ...deptFormData,
                                working_days: deptFormData.working_days.filter(
                                  (d) => d !== day.id
                                ),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`edit-${day.id}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDeptDialogOpen(false);
                      resetDeptForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateDeptMutation.isPending}>
                    {updateDeptMutation.isPending ? "Updating..." : "Update Department"}
                  </Button>
                </div>
              </form>
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
                  <Button type="submit" disabled={addDoctorMutation.isPending}>
                    {addDoctorMutation.isPending ? "Adding..." : "Add Doctor"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Doctor Confirmation Dialog */}
          <Dialog
            open={isDeleteDoctorDialogOpen}
            onOpenChange={setIsDeleteDoctorDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Doctor</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this doctor? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              {deletingDoctor && (
                <div className="py-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Trash2 className="h-5 w-5 text-red-600" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800">
                          {deletingDoctor.name}
                        </h4>
                        <p className="text-sm text-red-600">
                          Department: {selectedDepartment?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDoctorDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteDoctor}
                  disabled={deleteDoctorMutation.isPending}
                >
                  {deleteDoctorMutation.isPending ? "Deleting..." : "Delete Doctor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
