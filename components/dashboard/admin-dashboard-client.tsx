"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users,
    Calendar,
    Activity,
    Settings,
    FileText,
    UserPlus,
    Search,
    CheckCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    ClipboardCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { User } from "@/lib/types";
import { useUnifiedDashboardStats, usePendingReviewsCount, useWeeklyAppointmentsTrend } from "@/hooks/use-hospital-queries";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig
} from "@/components/ui/chart";

interface AdminDashboardClientProps {
    user: User;
}

export function AdminDashboardClient({ user }: AdminDashboardClientProps) {
    const router = useRouter();
    const {
        data: stats,
        isLoading: loading,
    } = useUnifiedDashboardStats(user.role, user.id);

    const { data: pendingReviewsCount = 0 } = usePendingReviewsCount(user.role === "reviewer" || user.role === "admin");
    const { data: weeklyTrend = [] } = useWeeklyAppointmentsTrend(user.role === "admin" || user.role === "receptionist");

    const isReviewer = user.role === "reviewer";
    const dashboardTitle = isReviewer ? "Reviewer Dashboard" : "Admin Dashboard";

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            pending_review: "Pending",
            reschedule_requested: "Reschedule",
            booked: "Confirmed",
            confirmed: "Confirmed",
            arrived: "Arrived",
            waiting: "Waiting",
            completed: "Done",
            no_show: "Missed",
            cancelled: "Cancelled",
            rescheduled: "Moved",
        };
        return labels[status] || status;
    };

    const getStatusTooltip = (status: string) => {
        const tooltips: { [key: string]: string } = {
            pending_review: "Awaiting confirmation",
            reschedule_requested: "Staff requested a new time",
            booked: "Appointment confirmed",
            confirmed: "Appointment confirmed",
            arrived: "Patient has arrived",
            waiting: "Patient is waiting",
            completed: "Appointment completed",
            no_show: "Patient did not show up",
            cancelled: "Appointment cancelled",
            rescheduled: "Moved to a new time",
        };
        return tooltips[status] || status;
    };

    const currentStats = stats || {
        upcomingAppointments: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        recentAppointments: [],
    };

    const chartData = weeklyTrend.length > 0 ? weeklyTrend : [
        { day: "Mon", appointments: 0, completed: 0 },
        { day: "Tue", appointments: 0, completed: 0 },
        { day: "Wed", appointments: 0, completed: 0 },
        { day: "Thu", appointments: 0, completed: 0 },
        { day: "Fri", appointments: 0, completed: 0 },
        { day: "Sat", appointments: 0, completed: 0 },
        { day: "Sun", appointments: 0, completed: 0 },
    ];

    const chartConfig = {
        appointments: {
            label: "Total Bookings",
            color: "hsl(var(--chart-1))",
        },
        completed: {
            label: "Completed",
            color: "hsl(var(--chart-2))",
        },
    } satisfies ChartConfig;

return (
        <TooltipProvider>
        <div className="space-y-8 p-1">
            {/* Header with more visual punch */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent capitalize">
                        {dashboardTitle}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Overview of appointments and tasks for {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button className="shadow-lg shadow-primary/20">
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Reports
                    </Button>
                </div>
            </div>

            {/* Stats Overview Rows - Enhanced Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-hidden relative border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">
                            {isReviewer ? "Total Pending Reviews" : "Appointments Today"}
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-blue-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {loading ? "..." : currentStats.totalAppointments}
                        </div>
                        <div className="flex items-center text-xs text-blue-100 mt-1 bg-white/20 w-fit px-2 py-0.5 rounded-full">
                            {isReviewer ? (
                                <>Awaiting your review</>
                            ) : (
                                <>
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    12% from yesterday
                                </>
                            )}
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4">
                            <Calendar className="h-32 w-32" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {isReviewer ? "Today's Pending" : "Checked In"}
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                            {loading ? "..." : currentStats.completedAppointments}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isReviewer 
                                ? "Due today" 
                                : `${loading ? "..." : Math.round((currentStats.completedAppointments / (currentStats.totalAppointments || 1)) * 100)}% attendance rate`}
                        </p>
                    </CardContent>
                </Card>

                <Link href="/dashboard/reviews" className="block">
                    <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Reviews
                            </CardTitle>
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <AlertCircle className="h-4 w-4" />
                            </div>
                        </CardHeader>
<CardContent>
                            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                {loading ? "..." : pendingReviewsCount}
                            </div>
                            <div className="flex items-center text-xs text-amber-600 mt-1 font-medium">
                                {pendingReviewsCount > 0 ? 'Requires attention' : 'All caught up!'} <ArrowUpRight className="ml-1 h-3 w-3" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Staff
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Activity className="h-4 w-4" />
                        </div>
                    </CardHeader>
<CardContent>
                        <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                            {loading ? "..." : (currentStats as any).activeStaffCount ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active staff members
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid with Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">

                {/* Left: Weekly Overview Chart (Span 4) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="h-full shadow-sm">
                        <CardHeader>
                            <CardTitle>Weekly Appointment Trends</CardTitle>
                            <CardDescription>Overview of appointments vs completions over the last 7 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <BarChart accessibilityLayer data={chartData}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="day"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="appointments" fill="var(--color-appointments)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Quick Actions & System (Span 3) */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="h-full shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common tasks for your role</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1">

                            {/* Reviewer Specific Action */}
                            {isReviewer && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-between h-auto py-4 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-900 dark:hover:bg-amber-950/40 group transition-all"
                                    onClick={() => router.push("/dashboard/reviews")}
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-full bg-amber-100 text-amber-600 mr-4 group-hover:scale-110 transition-transform">
                                            <ClipboardCheck className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold text-foreground">Review Appointments</div>
                                            <div className="text-xs text-muted-foreground">Approve pending bookings</div>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            )}

                            {!isReviewer && (
                                <Button variant="outline" className="w-full justify-between h-auto py-4 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 group transition-all">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <UserPlus className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold text-foreground">Register Patient</div>
                                            <div className="text-xs text-muted-foreground">New patient admission</div>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            )}

                            <Button variant="outline" className="w-full justify-between h-auto py-4 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 group transition-all">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-full bg-green-100 text-green-600 mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-foreground">Manage Schedule</div>
                                        <div className="text-xs text-muted-foreground">Doctor shifts & slots</div>
                                    </div>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </Button>

                            <Button variant="outline" className="w-full justify-between h-auto py-4 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 group transition-all">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-foreground">Staff Directory</div>
                                        <div className="text-xs text-muted-foreground">View medical staff</div>
                                    </div>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Today's Schedule Table */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Today's Schedule</CardTitle>
                        <CardDescription>Real-time updates for {new Date().toLocaleDateString()}</CardDescription>
                    </div>
                    <Link href="/dashboard/calendar">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            View Full Calendar <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3 p-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 items-center p-4 border-b">
                                    <div className="col-span-2">
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <div className="col-span-4 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <div className="col-span-3 space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <div className="col-span-2">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <Skeleton className="h-8 w-8 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : currentStats.recentAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                            <Calendar className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">No appointments scheduled for today</p>
                            <p className="text-sm">Check the calendar for upcoming bookings</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase border-b">
                                <div className="col-span-2">Time</div>
                                <div className="col-span-4">Patient</div>
                                <div className="col-span-3">Doctor/Dept</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-1 text-right">Actions</div>
                            </div>
                            {currentStats.recentAppointments.map((apt: any) => (
                                <div key={apt.id} className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-muted/40 rounded-lg transition-colors border-b last:border-0">
                                    <div className="col-span-2 font-mono font-medium text-slate-700 dark:text-slate-300">
                                        {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="col-span-4">
                                        <div className="font-semibold text-foreground">{apt.clientName || `Client #${apt.clientXNumber}`}</div>
                                        <div className="text-xs text-muted-foreground">ID: {apt.clientXNumber || 'N/A'}</div>
                                    </div>
                                    <div className="col-span-3">
                                        <div className="text-sm">{apt.doctorName || '-'}</div>
                                        <div className="text-xs text-muted-foreground">{apt.departmentName}</div>
                                    </div>
<div className="col-span-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-help 
                                            ${apt.status === 'confirmed' || apt.status === 'booked' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                        apt.status === 'pending_review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            apt.status === 'reschedule_requested' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                    {apt.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {(apt.status === 'pending' || apt.status === 'pending_review') && <Clock className="w-3 h-3 mr-1" />}
                                                    {getStatusLabel(apt.status)}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{getStatusTooltip(apt.status)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
</Card>
        </div>
        </TooltipProvider>
    );
}
