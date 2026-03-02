"use client";

import React from "react";
import {
    Clock,
    ClipboardCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import type { User } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { PendingReviewsMobileList } from "@/components/reviews/pending-reviews-mobile-list";

interface ReviewerMobileDashboardProps {
    user: User;
}

// Reuse the fetch function just for stats count if available, or fetch light stats
async function fetchStats() {
    const response = await fetch("/api/appointments/review?limit=100");
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch");
    return data.data.length;
}

export function ReviewerMobileDashboard({ user }: ReviewerMobileDashboardProps) {
    const { data: count = 0, isLoading } = useQuery({
        queryKey: ["reviews", "count"],
        queryFn: fetchStats,
        refetchInterval: 30000
    });

    // Helper for greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-1 pt-2 space-y-1"
            >
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    {getGreeting()}
                </h1>
                <p className="text-muted-foreground text-lg">
                    Ready to review appointments?
                </p>
            </motion.div>

            {/* Stats Summary Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50 dark:border-amber-900/50 rounded-2xl p-5 flex items-center justify-between"
            >
                <div>
                    <p className="text-amber-600 dark:text-amber-400 font-medium mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Pending
                    </p>
                    <h2 className="text-3xl font-bold text-foreground">
                        {isLoading ? "..." : count}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Waiting for approval
                    </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <ClipboardCheck className="w-6 h-6" />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <PendingReviewsMobileList user={user} showHeader={true} />
            </motion.div>
        </div>
    );
}
