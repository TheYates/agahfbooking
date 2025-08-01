import type React from "react";
import { requireAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ClientHeaderNav } from "@/components/client-header-nav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // Use header navigation for clients, sidebar for staff
  if (user.role === "client") {
    return (
      <div className="min-h-screen bg-background">
        <ClientHeaderNav user={user} />
        <main className="container mx-auto max-w-7xl px-6 py-6">
          {children}
        </main>
      </div>
    );
  }

  // Staff layout with header + sidebar
  return (
    <div className="[--header-height:3.5rem]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar user={user} />
          <SidebarInset>
            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
