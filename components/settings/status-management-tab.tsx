"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Palette,
  Plus,
  Trash2,
  Check,
  X,
  RefreshCw,
  MoreVertical,
  Pencil,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Valid status colors suitable for badges
const PRESET_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Gray", value: "#6B7280" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Orange", value: "#F97316" },
];

export function StatusManagementTab() {
  const statuses = useQuery(api.queries.getAppointmentStatuses, {});
  
  const createStatus = useMutation(api.mutations.createAppointmentStatus);
  const updateStatus = useMutation(api.mutations.updateAppointmentStatus);
  const deleteStatus = useMutation(api.mutations.deleteAppointmentStatus); // Ensure this exists or use deleteDoctor equivalent

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<Id<"appointment_statuses"> | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    color: PRESET_COLORS[0].value,
    isActive: true,
  });

  const isLoading = statuses === undefined;

  const resetForm = () => {
    setFormData({
      name: "",
      color: PRESET_COLORS[0].value,
      isActive: true,
    });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleEdit = (status: any) => {
    setFormData({
      name: status.status_name,
      color: status.status_color || "#3B82F6",
      isActive: status.is_active,
    });
    setEditingId(status._id);
    setIsCreating(true);
  };

  const handleCreate = () => {
    setFormData({
      name: "",
      color: PRESET_COLORS[0].value,
      isActive: true,
    });
    setEditingId(null);
    setIsCreating(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingId) {
        await updateStatus({
          id: editingId,
          status_name: formData.name,
          status_color: formData.color,
          is_active: formData.isActive,
        });
        toast.success("Status updated successfully");
      } else {
        await createStatus({
          status_name: formData.name,
          status_color: formData.color,
        });
        toast.success("Status created successfully");
      }
      resetForm();
    } catch (error) {
      toast.error("Failed to save status");
      console.error(error);
    }
  };

  const handleDelete = async (id: Id<"appointment_statuses">) => {
    if (!confirm("Are you sure? This might affect existing appointments.")) return;
    
    try {
      await deleteStatus({ id });
      toast.success("Status deleted successfully");
    } catch (error) {
      toast.error("Failed to delete status");
      console.error(error);
    }
  };

  const statusList = statuses || [];

  return (
    <div className="grid gap-6 md:grid-cols-12 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Left Panel: Status List */}
      <Card className="md:col-span-7 flex flex-col h-full border-muted/60 shadow-md">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Statuses</CardTitle>
              <CardDescription>Manage the lifecycle states of appointments</CardDescription>
            </div>
            <Button onClick={handleCreate} disabled={isCreating} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Status
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden bg-muted/5">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : statusList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <div className="bg-muted p-4 rounded-full mb-4">
                <Palette className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium">No statuses found</p>
              <p className="text-sm">Create your first appointment status to get started.</p>
              <Button onClick={handleCreate} variant="link" className="mt-2">
                Create Status
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {statusList.map((status) => (
                  <div
                    key={status._id}
                    onClick={() => handleEdit(status)}
                    className={cn(
                      "group relative flex flex-col justify-between p-4 rounded-xl border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer",
                      !status.is_active && "opacity-60 grayscale-[0.5] bg-muted/40"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${status.status_color}20` }}
                      >
                         <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.status_color }} 
                         />
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(status); }}>
                             <Pencil className="mr-2 h-4 w-4" /> Edit
                           </DropdownMenuItem>
                           <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={(e) => { e.stopPropagation(); handleDelete(status._id); }}
                           >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div>
                      <h4 className="font-semibold text-base capitalize mb-1">
                        {status.status_name.toLowerCase().replace(/_/g, " ")}
                      </h4>
                      <div className="flex items-center gap-2">
                        {status.is_active ? (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Right Panel: Editor */}
      <Card className={cn(
        "md:col-span-5 h-full border-muted/60 shadow-md transition-all duration-300",
        isCreating ? "opacity-100 translate-x-0" : "opacity-50 blur-[1px] pointer-events-none md:opacity-100 md:blur-0 md:pointer-events-auto"
      )}>
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle>{editingId ? "Edit Status" : "Create Status"}</CardTitle>
          <CardDescription>
            {editingId ? "Modify existing status details" : "Add a new status to the workflow"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label>Status Name</Label>
            <Input 
              placeholder="e.g., Triage, Consultation" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-3">
            <Label>Badge Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: c.value }))}
                  className={cn(
                    "w-full aspect-square rounded-md border-2 flex items-center justify-center transition-all",
                    formData.color === c.value 
                      ? "border-primary ring-2 ring-primary/20 scale-110" 
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {formData.color === c.value && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
               <div className="text-xs text-muted-foreground w-full">Or custom hex:</div>
               <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded border shrink-0" 
                    style={{ backgroundColor: formData.color }}
                  />
                  <Input 
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="h-8 font-mono text-xs w-24"
                    maxLength={7}
                  />
               </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
             <Label className="text-xs text-muted-foreground uppercase mb-2 block">Live Preview</Label>
             <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between bg-card p-3 rounded border shadow-sm">
                  <span className="text-sm font-medium">Appointment #123</span>
                  <Badge 
                    style={{ 
                      backgroundColor: `${formData.color}20`, 
                      color: formData.color,
                      border: `1px solid ${formData.color}40`
                    }}
                   >
                    {formData.name || "Status Name"}
                  </Badge>
               </div>
             </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <Label className="cursor-pointer" htmlFor="is-active">Active Status</Label>
            <Switch 
              id="is-active"
              checked={formData.isActive}
              onCheckedChange={(c) => setFormData(prev => ({ ...prev, isActive: c }))}
            />
          </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-4 bg-muted/5">
          {editingId ? (
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          ) : (
            <Button variant="ghost" onClick={resetForm}>Clear</Button>
          )}
          <Button onClick={handleSubmit} disabled={!formData.name}>
            {editingId ? "Save Changes" : "Create Status"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
