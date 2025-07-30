"use client";

import {
  Calendar,
  Home,
  UserIcon,
  Settings,
  Users,
  BarChart3,
  Building2,
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

interface DashboardSidebarProps {
  user: User;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const clientMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
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
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">Hospital System</h2>
          <p className="text-sm text-muted-foreground">
            {user.name} ({user.xNumber})
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {user.role} • {user.category}
          </p>
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
          className="w-full bg-transparent"
        >
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
