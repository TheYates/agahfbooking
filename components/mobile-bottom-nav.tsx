"use client";

import { Home, Calendar, Plus, CalendarDays, User, List, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { User as UserType } from "@/lib/types";

interface MobileBottomNavProps {
  onBookingClick?: () => void;
  user?: UserType;
}

export function MobileBottomNav({ onBookingClick, user }: MobileBottomNavProps) {
  const pathname = usePathname();

  const clientNavItems = [
    {
      title: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      title: "My Appts",
      href: "/dashboard/my-appointments",
      icon: List,
      isActive: pathname === "/dashboard/my-appointments",
    },
    {
      title: "Book",
      href: "#",
      icon: Plus,
      isAdd: true,
      onClick: onBookingClick,
    },
    {
      title: "Schedule",
      href: "/dashboard/calendar",
      icon: CalendarDays,
      isActive: pathname === "/dashboard/calendar",
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
      isActive: pathname === "/dashboard/profile",
    },
  ];

  const reviewerNavItems = [
    {
      title: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Reviews",
      href: "/dashboard/reviews",
      icon: ClipboardCheck,
      isActive: pathname === "/dashboard/reviews",
    },
    {
      title: "Calendar",
      href: "/dashboard/calendar",
      icon: CalendarDays,
      isActive: pathname === "/dashboard/calendar",
    },
    {
      title: "Appts",
      href: "/dashboard/appointments",
      icon: List,
      isActive: pathname === "/dashboard/appointments",
    },
    {
      title: "Profile", // Added Profile for consistency/logout access
      href: "/dashboard/profile",
      icon: User,
      isActive: pathname === "/dashboard/profile",
    },
  ];

  // Logic: 
  // - Client: Standard Client Nav
  // - Reviewer: Reviewer Nav
  // - Admin/Receptionist: Could fallback to Reviewer-like or keep generic. 
  //   For now, we prioritize Reviewer as requested. Admin generally uses sidebar on desktop but on mobile generic nav is okay?
  //   Actually, Admin on mobile might need access to more too, but user asked for Reviewer.
  //   Let's map Admin to reviewerNavItems for now as it's better than Client nav for them (no "Book" button needed).

  const navItems = (user?.role === "reviewer" || user?.role === "admin" || user?.role === "receptionist")
    ? reviewerNavItems
    : clientNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none p-4 pb-6">
      <div className="pointer-events-auto mx-auto max-w-sm">
        <div className="relative flex items-center justify-around bg-black/80 dark:bg-white/10 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-full px-2 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">

          {navItems.map((item) => {
            if (item.isAdd) {
              return (
                <div key={item.title} className="-mt-8">
                  <Button
                    onClick={item.onClick}
                    size="icon"
                    className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-400 shadow-xl ring-4 ring-black/80 dark:ring-background"
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
                    </motion.div>
                  </Button>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = item.isActive;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center min-w-[4rem] py-2 transition-all duration-300",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navBlob"
                    className="absolute inset-x-1 inset-y-1 bg-white/[0.08] dark:bg-white/[0.05] rounded-[18px] border border-white/5"
                    initial={false}
                    transition={{
                      type: "spring",
                      bounce: 0.15,
                      duration: 0.5,
                    }}
                  />
                )}

                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <Icon
                    className={cn(
                      "h-[22px] w-[22px] transition-all duration-300",
                      isActive
                        ? "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                        : "text-zinc-400"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
