"use client";

import React from "react";
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
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface MobileDashboardClientProps {
  user: User;
  onBookingClick?: (departmentId?: number) => void;
}

interface Department {
  _id: Id<"departments">;
  name: string;
  description?: string;
  color: string;
  slots_per_day: number;
  is_active: boolean;
}

export function MobileDashboardClientConvex({
  user,
  onBookingClick,
}: MobileDashboardClientProps) {
  // Fetch dashboard statistics using Convex
  const stats = useQuery(
    api.queries.getClientDashboardStats,
    user.role === "client" && user.convexId
      ? { clientId: user.convexId as Id<"clients"> }
      : "skip"
  );

  // Fetch departments using Convex
  const allDepartments = useQuery(api.queries.getDepartments, {
    isActive: true,
  });

  const loading = stats === undefined || allDepartments === undefined;
  const error = stats === null || allDepartments === null;

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

    // Check for upcoming appointment
    const upcomingAppointment =
      stats?.recentAppointments && stats.recentAppointments.length > 0
        ? stats.recentAppointments[0]
        : null;

    if (upcomingAppointment && stats?.daysUntilNext !== null) {
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

  // Get department icon based on department name
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

  const handleDepartmentClick = (departmentId: string) => {
    // Convert Convex ID string to number for compatibility
    // Note: This assumes the numeric ID can be extracted or mapped
    // For now, we'll pass the string and let the parent handle it
    onBookingClick?.(parseInt(departmentId, 10) || 0);
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
              {allDepartments?.map((department, index) => (
                <motion.div
                  key={department._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex-shrink-0"
                >
                  <button
                    onClick={() => handleDepartmentClick(department._id)}
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
                        {department.description || "Healthcare services"}
                      </p>
                      <p className="text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-full inline-block">
                        {department.slots_per_day} slots per day
                      </p>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Scroll indicator dots */}
            {allDepartments && allDepartments.length > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {allDepartments.map((_, index) => (
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
