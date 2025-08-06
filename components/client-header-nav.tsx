"use client";

import { Calendar, Home, UserIcon, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface ClientHeaderNavProps {
  user: User;
}

export function ClientHeaderNav({ user }: ClientHeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const clientMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    {
      title: "Appointments",
      url: "/dashboard/my-appointments",
      icon: Calendar,
    },
    { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
    { title: "Profile", url: "/dashboard/profile", icon: UserIcon },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });

      // Redirect based on user role
      if (user.role === "client") {
        router.push("/login");
      } else {
        router.push("/staff-login");
      }
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: redirect based on role anyway
      if (user.role === "client") {
        router.push("/login");
      } else {
        router.push("/staff-login");
      }
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl flex h-14 items-center justify-between px-6">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">
                H
              </span>
            </div>
            <span className="font-semibold text-base">Hospital System</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          <NavigationMenu>
            <NavigationMenuList>
              {clientMenuItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <Link href={item.url} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "h-9 px-3 py-2 text-sm",
                        pathname === item.url &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {clientMenuItems.map((item) => (
                  <DropdownMenuItem key={item.title} asChild>
                    <Link href={item.url} className="flex items-center">
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.xNumber} • {user.category}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
