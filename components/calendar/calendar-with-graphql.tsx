"use client";

import React, { useState, useMemo } from 'react';
import { useCalendarData, useCreateAppointment, useUpdateAppointment } from '@/lib/graphql/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CalendarWithGraphQLProps {
  userRole: 'CLIENT' | 'RECEPTIONIST' | 'ADMIN';
  currentUserId: string;
  initialView?: 'MONTH' | 'WEEK' | 'DAY';
  includeStats?: boolean;
}

export function CalendarWithGraphQL({
  userRole,
  currentUserId,
  initialView = 'MONTH',
  includeStats = false,
}: CalendarWithGraphQLProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(initialView);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Single GraphQL query replaces multiple API calls!
  const { data, loading, error, refetch } = useCalendarData(
    userRole,
    currentUserId,
    view,
    currentDate.toISOString().split('T')[0],
    includeStats
  );

  // Mutations for creating/updating appointments
  const [createAppointment, { loading: creating }] = useCreateAppointment();
  const [updateAppointment, { loading: updating }] = useUpdateAppointment();

  // Memoized data processing
  const { appointments, departments, doctors, stats } = useMemo(() => {
    if (!data?.calendarData) {
      return { appointments: [], departments: [], doctors: [], stats: null };
    }

    return {
      appointments: data.calendarData.appointments || [],
      departments: data.calendarData.departments || [],
      doctors: data.calendarData.doctors || [],
      stats: data.calendarData.stats,
    };
  }, [data]);

  // Group appointments by date for calendar display
  const appointmentsByDate = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    appointments.forEach((appointment: any) => {
      const date = appointment.appointmentDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });
    return grouped;
  }, [appointments]);

  // Handle appointment creation
  const handleCreateAppointment = async (appointmentData: any) => {
    try {
      await createAppointment({
        variables: {
          input: appointmentData,
        },
      });
      // Refetch calendar data to ensure consistency
      refetch();
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };

  // Handle appointment update
  const handleUpdateAppointment = async (id: string, updates: any) => {
    try {
      await updateAppointment({
        variables: {
          id,
          input: updates,
        },
      });
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      BOOKED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      ARRIVED: 'bg-yellow-100 text-yellow-800',
      WAITING: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-emerald-100 text-emerald-800',
      NO_SHOW: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      RESCHEDULED: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Failed to load calendar data</p>
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Section (if included) */}
      {includeStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Upcoming</p>
                  <p className="text-2xl font-bold">{stats.upcomingAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">This Month</p>
                  <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Available</p>
                  <p className="text-2xl font-bold">{stats.availableSlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calendar</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={view === 'DAY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('DAY')}
              >
                Day
              </Button>
              <Button
                variant={view === 'WEEK' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('WEEK')}
              >
                Week
              </Button>
              <Button
                variant={view === 'MONTH' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('MONTH')}
              >
                Month
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Appointments List */}
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No appointments found for this period</p>
              </div>
            ) : (
              appointments.map((appointment: any) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: appointment.department.color }}
                      />
                      <div>
                        <p className="font-medium">{appointment.client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.department.name}
                          {appointment.doctor && ` • ${appointment.doctor.name}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Slot {appointment.slotNumber}
                      </p>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {appointment.notes}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Department Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {departments.map((department: any) => (
              <div key={department.id} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: department.color }}
                />
                <span className="text-sm">{department.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CalendarWithGraphQL;
