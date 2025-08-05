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
import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

interface MobileHeaderProps {
  user: User;
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/dashboard/my-appointments") return "Appointments";
    if (pathname === "/dashboard/calendar") return "Calendar";
    if (pathname === "/dashboard/profile") return "Profile";
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
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-pt">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo and Page Title */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">H</span>
          </div>
          <h1 className="font-semibold text-lg">{getPageTitle()}</h1>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.xNumber} • {user.category}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="w-full flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
