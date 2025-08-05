"use client";

import { Home, Calendar, Plus, CalendarDays, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface MobileBottomNavProps {
  onBookingClick?: () => void;
}

export function MobileBottomNav({ onBookingClick }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Booking",
      href: "/dashboard/my-appointments",
      icon: Calendar,
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
      title: "Calendar",
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          if (item.isAdd) {
            return (
              <Button
                key={item.title}
                onClick={item.onClick}
                size="icon"
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </motion.div>
              </Button>
            );
          }

          return item.href === "#" ? (
            <button
              key={item.title}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors",
                "hover:bg-accent hover:text-accent-foreground rounded-lg",
                item.isActive && "text-primary"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="flex flex-col items-center justify-center"
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 mb-1",
                    item.isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium leading-none",
                    item.isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.title}
                </span>
              </motion.div>

              {item.isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ) : (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors",
                "hover:bg-accent hover:text-accent-foreground rounded-lg",
                item.isActive && "text-primary"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="flex flex-col items-center justify-center"
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 mb-1",
                    item.isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium leading-none",
                    item.isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.title}
                </span>
              </motion.div>

              {item.isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
