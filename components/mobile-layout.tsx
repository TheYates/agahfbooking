"use client";

import { useState, createContext, useContext } from "react";
import { MobileHeader } from "@/components/mobile-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileBookingSheet } from "@/components/dashboard/mobile-booking-sheet";
import type { User } from "@/lib/types";

interface BookingContextType {
  openBooking: (departmentId?: number) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a MobileLayout");
  }
  return context;
};

interface MobileLayoutProps {
  children: React.ReactNode;
  user: User;
}

export function MobileLayout({ children, user }: MobileLayoutProps) {
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | undefined
  >();

  const handleBookingClick = (departmentId?: number) => {
    setSelectedDepartmentId(departmentId);
    setIsBookingSheetOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingSheetOpen(false);
    setSelectedDepartmentId(undefined);
  };

  const handleBookingSuccess = () => {
    handleCloseBooking();
  };

  const bookingContextValue = {
    openBooking: handleBookingClick,
  };

  return (
    <BookingContext.Provider value={bookingContextValue}>
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <MobileHeader user={user} />

        {/* Main content area with bottom padding for navigation */}
        <main className="container mx-auto max-w-7xl px-4 py-4 pb-24">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onBookingClick={handleBookingClick} />

        {/* Mobile Booking Sheet */}
        <MobileBookingSheet
          isOpen={isBookingSheetOpen}
          onClose={handleCloseBooking}
          onBookingSuccess={handleBookingSuccess}
          user={user}
          selectedDepartmentId={selectedDepartmentId}
        />
      </div>
    </BookingContext.Provider>
  );
}
