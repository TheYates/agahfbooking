"use client";

import React, { useState, useEffect } from "react";

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
import {
  cachedFetch,
  departmentCache,
  userStatsCache,
} from "@/lib/cache-utils";

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

  // Fetch dashboard statistics and departments with caching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Check cache first for departments
        const cachedDepartments = departmentCache.get();
        const cachedStats = userStatsCache.get(user.id);

        // If we have cached data, show it immediately
        if (cachedDepartments) {
          setDepartments(cachedDepartments.data || cachedDepartments);
        }
        if (cachedStats) {
          setStats(cachedStats.data || cachedStats);
          setLoading(false);
        }

        // Fetch fresh data in background
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          // Use cached fetch for departments (5 min cache)
          const deptPromise = cachedFetch(
            "/api/departments",
            "departments",
            300000, // 5 minutes
            { signal: controller.signal }
          );

          // Always fetch fresh stats (1 min cache)
          const statsPromise = cachedFetch(
            `/api/dashboard/stats?clientId=${user.id}`,
            `user_stats_${user.id}`,
            60000, // 1 minute
            {
              signal: controller.signal,
              headers: { "Cache-Control": "no-cache" },
            }
          );

          const [deptData, statsData] = await Promise.all([
            deptPromise,
            statsPromise,
          ]);

          clearTimeout(timeoutId);

          // Update stats
          setStats((statsData as any).data || statsData);

          // Update departments
          if ((deptData as any).data) {
            setDepartments((deptData as any).data);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);

          // If we have cached data, don't show error
          if (!cachedDepartments && !cachedStats) {
            if (
              fetchError instanceof Error &&
              fetchError.name === "AbortError"
            ) {
              setError(
                "Request timed out. Please check your connection and try again."
              );
            } else {
              setError(
                fetchError instanceof Error
                  ? fetchError.message
                  : "Failed to load dashboard data"
              );
            }
          }

          // Provide fallback departments if no cache available
          if (!cachedDepartments) {
            setDepartments([
              {
                id: 1,
                name: "General Medicine",
                description: "General health consultations",
                color: "#3B82F6",
              },
              {
                id: 2,
                name: "Emergency",
                description: "Urgent medical care",
                color: "#EF4444",
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user.id) {
      fetchData();
    }
  }, [user.id]);

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

    // Show time-based greeting immediately, even while loading
    if (loading) {
      return {
        greeting: `${timeGreeting}, ${user.name}!`,
        subtext: "Loading your dashboard...",
      };
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
          subtext: (
            <>
              Your <strong>{upcomingAppointment.departmentName}</strong>{" "}
              appointment is <strong>today</strong>
            </>
          ),
        };
      } else if (stats.daysUntilNext === 1) {
        return {
          greeting: `${timeGreeting}, ${user.name}!`,
          subtext: (
            <>
              Your <strong>{upcomingAppointment.departmentName}</strong>{" "}
              appointment is <strong>tomorrow</strong> ({formattedDate})
            </>
          ),
        };
      } else {
        return {
          greeting: `${timeGreeting}, ${user.name}!`,
          subtext: (
            <>
              Your upcoming{" "}
              <strong>{upcomingAppointment.departmentName}</strong> appointment
              is on <strong>{formattedDate}</strong>
            </>
          ),
        };
      }
    }

    return {
      greeting: `${timeGreeting}, ${user.name}!`,
      subtext: "Ready to book your next appointment?",
    };
  };

  // Get department icon based on department name (since icon is not stored in DB)
  const getDepartmentIcon = (departmentName: string) => {
    const iconProps = "h-6 w-6 text-primary";
    const name = departmentName.toLowerCase();

    if (name.includes("cardio") || name.includes("heart")) {
      return <Heart className={iconProps} />;
    } else if (
      name.includes("pediatric") ||
      name.includes("child") ||
      name.includes("baby")
    ) {
      return <Baby className={iconProps} />;
    } else if (name.includes("general") || name.includes("medicine")) {
      return <Stethoscope className={iconProps} />;
    } else if (name.includes("emergency") || name.includes("urgent")) {
      return <Building2 className={iconProps} />;
    } else if (name.includes("neuro") || name.includes("brain")) {
      return <Brain className={iconProps} />;
    } else if (name.includes("eye") || name.includes("ophthal")) {
      return <Eye className={iconProps} />;
    } else if (name.includes("pharmacy") || name.includes("drug")) {
      return <Pill className={iconProps} />;
    } else {
      return <Stethoscope className={iconProps} />; // Default to stethoscope
    }
  };

  const handleDepartmentClick = (departmentId: number) => {
    onBookingClick?.(departmentId);
  };

  const { greeting, subtext } = getDynamicGreeting();

  return (
    <div className="space-y-8">
      {/* Dynamic Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3 px-1"
      >
        <h1 className="text-5xl font-bold text-foreground leading-tight">
          {greeting}
        </h1>
        <div className="text-muted-foreground text-base leading-relaxed">
          {subtext}
        </div>
      </motion.div>

      {/* Departments Carousel - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="px-1">
          <h2 className="text-xl font-semibold text-foreground mb-2">
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
            <div className="flex gap-4 overflow-x-auto pb-2 px-1 hide-scrollbar">
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
                      "w-[260px] h-[280px] p-5 rounded-2xl transition-all duration-200",
                      "touch-target flex flex-col justify-between",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      "bg-card border border-border",
                      "hover:border-primary/30 hover:shadow-lg"
                    )}
                  >
                    {/* Top section with icon and arrow */}
                    <div className="flex items-start justify-between w-full">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        {getDepartmentIcon(department.name)}
                      </div>
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Bottom section with text content */}
                    <div className="flex-1 text-left mt-6">
                      <h3 className="font-semibold text-lg text-foreground mb-2 leading-tight">
                        {department.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {department.description}
                      </p>
                      {department.available_slots !== undefined && (
                        <p className="text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-full inline-block">
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
              <div className="flex justify-center mt-6 space-x-2">
                {departments.map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full bg-muted-foreground/40"
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
