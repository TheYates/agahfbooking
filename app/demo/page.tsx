"use client";

import { HospitalBookingCard } from "@/components/ui/hospital-booking-card";
import { useState } from "react";

// Mock data for demo
const mockDepartments = [
  { id: 1, name: "Cardiology", description: "Heart and cardiovascular care" },
  { id: 2, name: "Dermatology", description: "Skin and cosmetic treatments" },
  { id: 3, name: "Orthopedics", description: "Bone and joint care" },
  { id: 4, name: "Neurology", description: "Brain and nervous system" },
  { id: 5, name: "Pediatrics", description: "Children's healthcare" }
];

const mockClients = [
  { id: 1, name: "John Doe", x_number: "X1234/56", phone: "+1234567890" },
  { id: 2, name: "Jane Smith", x_number: "X2345/67", phone: "+1234567891" },
  { id: 3, name: "Bob Johnson", x_number: "X3456/78", phone: "+1234567892" },
  { id: 4, name: "Alice Brown", x_number: "X4567/89", phone: "+1234567893" }
];

const mockWeekSchedule = [
  {
    date: "2025-08-01",
    displayDate: "Aug 1",
    dayName: "Friday",
    dayNumber: 1,
    hasAvailability: true,
    slots: [
      { time: "Slot 1", available: true },
      { time: "Slot 2", available: false, clientXNumber: "X1234/56" },
      { time: "Slot 3", available: true },
      { time: "Slot 4", available: true },
      { time: "Slot 5", available: false, clientXNumber: "X2345/67" }
    ]
  },
  {
    date: "2025-08-02",
    displayDate: "Aug 2",
    dayName: "Saturday",
    dayNumber: 2,
    hasAvailability: true,
    slots: [
      { time: "Slot 1", available: true },
      { time: "Slot 2", available: true },
      { time: "Slot 3", available: false, clientXNumber: "X3456/78" },
      { time: "Slot 4", available: true },
      { time: "Slot 5", available: true }
    ]
  },
  {
    date: "2025-08-03",
    displayDate: "Aug 3",
    dayName: "Sunday",
    dayNumber: 3,
    hasAvailability: false,
    slots: []
  },
  {
    date: "2025-08-04",
    displayDate: "Aug 4",
    dayName: "Monday",
    dayNumber: 4,
    hasAvailability: true,
    slots: [
      { time: "Slot 1", available: true },
      { time: "Slot 2", available: true },
      { time: "Slot 3", available: true },
      { time: "Slot 4", available: false, clientXNumber: "X4567/89" },
      { time: "Slot 5", available: true }
    ]
  },
  {
    date: "2025-08-05",
    displayDate: "Aug 5",
    dayName: "Tuesday",
    dayNumber: 5,
    hasAvailability: true,
    slots: [
      { time: "Slot 1", available: false, clientXNumber: "X1234/56" },
      { time: "Slot 2", available: true },
      { time: "Slot 3", available: true },
      { time: "Slot 4", available: true },
      { time: "Slot 5", available: true }
    ]
  }
];

export default function DemoPage() {
  const [selectedClient, setSelectedClient] = useState(mockClients[0]);
  const [userRole, setUserRole] = useState<"staff" | "client">("client");

  const handleDepartmentChange = (department: any) => {
    console.log("Department changed:", department);
  };

  const handleTimeSlotSelect = (day: string, time: string) => {
    console.log("Time slot selected:", { day, time });
    alert(`Selected: ${time} on ${day}`);
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    console.log("Week navigation:", direction);
  };

  const handleClientChange = (client: any) => {
    setSelectedClient(client);
    console.log("Client changed:", client);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Hospital Booking Card Demo
          </h1>
          <p className="text-lg text-muted-foreground">
            A modern, animated booking interface inspired by coach scheduling
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setUserRole("client")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              userRole === "client"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Client View
          </button>
          <button
            onClick={() => setUserRole("staff")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              userRole === "staff"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Staff View
          </button>
        </div>

        {/* Demo Component */}
        <div className="flex justify-center">
          <HospitalBookingCard
            departments={mockDepartments}
            weekSchedule={mockWeekSchedule}
            clients={mockClients}
            selectedClient={selectedClient}
            userRole={userRole}
            onDepartmentChange={handleDepartmentChange}
            onTimeSlotSelect={handleTimeSlotSelect}
            onWeekChange={handleWeekChange}
            onClientChange={handleClientChange}
            enableAnimations={true}
            className="w-full max-w-2xl"
          />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-card rounded-lg border border-border/50">
            <h3 className="font-semibold text-foreground mb-2">🎨 Modern Design</h3>
            <p className="text-sm text-muted-foreground">
              Beautiful, clean interface with smooth animations and responsive design
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border/50">
            <h3 className="font-semibold text-foreground mb-2">⚡ Smooth Animations</h3>
            <p className="text-sm text-muted-foreground">
              Framer Motion powered animations with reduced motion support
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border/50">
            <h3 className="font-semibold text-foreground mb-2">📱 Responsive</h3>
            <p className="text-sm text-muted-foreground">
              Works perfectly on mobile, tablet, and desktop devices
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border/50">
            <h3 className="font-semibold text-foreground mb-2">🔒 Privacy Aware</h3>
            <p className="text-sm text-muted-foreground">
              Masks client X-numbers appropriately based on user role
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border/50">
            <h3 className="font-semibold text-foreground mb-2">♿ Accessible</h3>
            <p className="text-sm text-muted-foreground">
              Full keyboard navigation and screen reader support
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border/50">
            <h3 className="font-semibold text-foreground mb-2">🎯 Smart Logic</h3>
            <p className="text-sm text-muted-foreground">
              Prevents past date booking and handles edge cases gracefully
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
