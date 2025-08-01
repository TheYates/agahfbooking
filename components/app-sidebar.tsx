"use client";

import {
  Calendar,
  Home,
  UserIcon,
  Settings,
  Users,
  BarChart3,
  Building2,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
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

  const receptionistMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
    { title: "Appointments", url: "/dashboard/appointments", icon: Calendar },
    { title: "Clients", url: "/dashboard/clients", icon: Users },
    { title: "Departments", url: "/dashboard/departments", icon: Building2 },
  ];

  const adminMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
    { title: "Appointments", url: "/dashboard/appointments", icon: Calendar },
    { title: "Clients", url: "/dashboard/clients", icon: Users },
    { title: "Departments", url: "/dashboard/departments", icon: Building2 },
    { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ];

  const getMenuItems = () => {
    switch (user.role) {
      case "admin":
        return adminMenuItems;
      case "receptionist":
        return receptionistMenuItems;
      default:
        return clientMenuItems;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: redirect anyway
      router.push("/login");
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <img
              src="/agahflogo.svg"
              alt="AGAHF Logo"
              className="size-4 dark:hidden"
            />
            <img
              src="/agahflogo white.svg"
              alt="AGAHF Logo"
              className="size-4 hidden dark:block"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">AGAHF Hospital</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.name} • {user.role}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
