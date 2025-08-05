"use client";

import { useState, useEffect } from "react";

import {
  ArrowRight,
  Building2,
  Stethoscope,
  Heart,
  Brain,
  Eye,
  Pill,
  Baby,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface MobileDashboardClientProps {
  user: User;
  onBookingClick?: (departmentId?: number) => void;
}

interface DashboardStats {
  upcomingAppointments: number;
  totalAppointments: number;
  completedAppointments: number;
  availableSlots: number;
  daysUntilNext: number | null;
  nextAppointment?: {
    date: string;
    departmentName: string;
    doctorName: string;
  };
  recentAppointments: Array<{
    id: number;
    date: string;
    slotNumber: number;
    status: string;
    doctorName: string;
    departmentName: string;
    departmentColor: string;
    clientName?: string;
    clientXNumber?: string;
  }>;
}

interface Department {
  id: number;
  name: string;
  description: string;
  color: string;
  icon?: string; // Make icon optional
  available_slots?: number;
}

export function MobileDashboardClient({
  user,
  onBookingClick,
}: MobileDashboardClientProps) {
  const [stats, setStats] = useState<DashboardStats>({
    upcomingAppointments: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    availableSlots: 0,
    daysUntilNext: null,
    recentAppointments: [],
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard statistics and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch stats and departments in parallel
        const [statsResponse, deptResponse] = await Promise.all([
          fetch(`/api/dashboard/stats?clientId=${user.id}`),
          fetch("/api/departments"),
        ]);

        const [statsData, deptData] = await Promise.all([
          statsResponse.json(),
          deptResponse.json(),
        ]);

        if (!statsResponse.ok) {
          throw new Error(
            statsData.error || "Failed to fetch dashboard statistics"
          );
        }

        setStats(statsData.data || statsData);

        // Handle departments - don't fail if departments API is down
        let departmentsToUse = [];
        if (deptResponse.ok && deptData.data) {
          departmentsToUse = deptData.data;
        } else {
          console.warn(
            "Failed to fetch departments, using fallback:",
            deptData.error
          );
          // Fallback departments
          departmentsToUse = [
            {
              id: 1,
              name: "General Medicine",
              description: "General health consultations",
              color: "#3B82F6",
              icon: "stethoscope",
            },
            {
              id: 2,
              name: "Cardiology",
              description: "Heart and cardiovascular care",
              color: "#EF4444",
              icon: "heart",
            },
            {
              id: 3,
              name: "Pediatrics",
              description: "Children's healthcare",
              color: "#10B981",
              icon: "baby",
            },
            {
              id: 4,
              name: "Emergency",
              description: "Urgent medical care",
              color: "#F59E0B",
              icon: "building2",
            },
          ];
        }

        setDepartments(departmentsToUse);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );

        // Even on error, provide fallback departments so the interface is usable
        setDepartments([
          {
            id: 1,
            name: "General Medicine",
            description: "General health consultations",
            color: "#3B82F6",
            icon: "stethoscope",
          },
          {
            id: 2,
            name: "Emergency",
            description: "Urgent medical care",
            color: "#EF4444",
            icon: "building2",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) {
      fetchData();
    }
  }, [user.id]);

  // Helper function to get status colors
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      booked: "#3B82F6",
      confirmed: "#10B981",
      arrived: "#F59E0B",
      waiting: "#8B5CF6",
      completed: "#059669",
      no_show: "#EF4444",
      cancelled: "#6B7280",
      rescheduled: "#F97316",
    };
    return colors[status] || "#6B7280";
  };

  // Dynamic greeting based on time and upcoming appointments
  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "";

    if (hour < 12) {
      timeGreeting = "Good Morning";
    } else if (hour < 17) {
      timeGreeting = "Good Afternoon";
    } else {
      timeGreeting = "Good Evening";
    }

    // Check for upcoming appointment - either from nextAppointment or first recent appointment
    const upcomingAppointment =
      stats.nextAppointment ||
      (stats.recentAppointments && stats.recentAppointments.length > 0
        ? stats.recentAppointments[0]
        : null);

    if (upcomingAppointment && stats.daysUntilNext !== null) {
      const appointmentDate = new Date(upcomingAppointment.date);
      const formattedDate = appointmentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      if (stats.daysUntilNext === 0) {
        return {
          greeting: `${timeGreeting}, ${user.name}!`,
          subtext: `Your ${upcomingAppointment.departmentName} appointment is today`,
        };
      } else if (stats.daysUntilNext === 1) {
        return {
          greeting: `${timeGreeting}, ${user.name}!`,
          subtext: `Your ${upcomingAppointment.departmentName} appointment is tomorrow (${formattedDate})`,
        };
      } else {
        return {
          greeting: `${timeGreeting}, ${user.name}!`,
          subtext: `Your upcoming ${upcomingAppointment.departmentName} appointment is on ${formattedDate}`,
        };
      }
    }

    return {
      greeting: `Welcome back, ${user.name}!`,
      subtext: "Ready to book your next appointment?",
    };
  };

  // Get department icon
  const getDepartmentIcon = (iconName: string | undefined | null) => {
    const iconProps = "h-6 w-6 text-primary";

    if (!iconName || typeof iconName !== "string") {
      return <Building2 className={iconProps} />; // Default icon
    }

    switch (iconName.toLowerCase()) {
      case "building2":
        return <Building2 className={iconProps} />;
      case "stethoscope":
        return <Stethoscope className={iconProps} />;
      case "heart":
        return <Heart className={iconProps} />;
      case "brain":
        return <Brain className={iconProps} />;
      case "eye":
        return <Eye className={iconProps} />;
      case "pill":
        return <Pill className={iconProps} />;
      case "baby":
        return <Baby className={iconProps} />;
      default:
        return <Building2 className={iconProps} />;
    }
  };

  const handleDepartmentClick = (departmentId: number) => {
    onBookingClick?.(departmentId);
  };

  const { greeting, subtext } = getDynamicGreeting();

  return (
    <div className="space-y-6">
      {/* Dynamic Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-2"
      >
        <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
        <p className="text-muted-foreground">{subtext}</p>
      </motion.div>

      {/* Departments Carousel - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="px-1">
          <h2 className="text-xl font-semibold text-foreground">
            Book by Department
          </h2>
          <p className="text-sm text-muted-foreground">
            Select a department to quickly book an appointment
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p className="text-sm">Error loading departments</p>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal scrolling container */}
            <div className="flex gap-4 overflow-x-auto pb-4 px-1 hide-scrollbar">
              {departments.map((department, index) => (
                <motion.div
                  key={department.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex-shrink-0"
                >
                  <button
                    onClick={() => handleDepartmentClick(department.id)}
                    className={cn(
                      "w-[280px] h-[400px] p-6 rounded-xl transition-all duration-200",
                      "touch-target flex flex-col justify-between",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      "bg-card border border-border",
                      "hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    {/* Top section with icon and arrow */}
                    <div className="flex items-start justify-between w-full">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        {getDepartmentIcon(department.icon)}
                      </div>
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Bottom section with text content */}
                    <div className="flex-1 text-left mt-4">
                      <h3 className="font-semibold text-lg text-foreground mb-2 leading-tight">
                        {department.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {department.description}
                      </p>
                      {department.available_slots !== undefined && (
                        <p className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full inline-block">
                          {department.available_slots} slots available
                        </p>
                      )}
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Scroll indicator dots */}
            {departments.length > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                {departments.map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full bg-muted-foreground/30"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
