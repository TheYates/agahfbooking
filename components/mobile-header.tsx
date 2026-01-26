"use client";

import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { motion } from "framer-motion";

interface MobileHeaderProps {
  user: User;
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname === "/dashboard/my-appointments") return "My Appointments";
    if (pathname === "/dashboard/calendar") return "Schedule";
    if (pathname === "/dashboard/profile") return "My Profile";
    return "Dashboard";
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (user.role === "client") {
        router.push("/login");
      } else {
        router.push("/staff-login");
      }
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      if (user.role === "client") {
        router.push("/login");
      } else {
        router.push("/staff-login");
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 supports-[backdrop-filter]:bg-background/60 safe-area-pt">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Branding & Title */}
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <img
              src="/agahflogo.svg"
              alt="AGAHF Logo"
              className="h-5 w-5 dark:hidden"
            />
            <img
              src="/agahflogo white.svg"
              alt="AGAHF Logo"
              className="h-5 w-5 hidden dark:block"
            />
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight leading-none text-foreground">{getPageTitle()}</h1>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">AGAHF Hospital</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Button (Mock) */}
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-primary/10">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="flex items-center gap-3 p-2 bg-muted/40 rounded-lg mb-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                  {getUserInitials(user.name)}
                </div>
                <div className="flex flex-col space-y-0.5 overflow-hidden">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    {user.xNumber}
                  </p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary w-fit">
                    {user.category}
                  </span>
                </div>
              </div>
              
              <DropdownMenuItem asChild className="cursor-pointer">
                <button
                  onClick={() => router.push("/dashboard/profile")}
                  className="w-full flex items-center py-2.5"
                >
                  <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
                  Account Settings
                </button>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-1" />
              
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
