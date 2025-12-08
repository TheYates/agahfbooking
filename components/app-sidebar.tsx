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
  MessageSquare,
  UserCog,
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();

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
    { title: "Users", url: "/dashboard/users", icon: UserCog },
    { title: "Test SMS", url: "/dashboard/test-sms", icon: MessageSquare },
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-8 items-center justify-center">
            <img
              src="/agahflogo.svg"
              alt="AGAHF Logo"
              className="size-8 dark:hidden"
            />
            <img
              src="/agahflogo white.svg"
              alt="AGAHF Logo"
              className="size-8 hidden dark:block"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">AGAHF BOOKING</span>
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
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
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

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
