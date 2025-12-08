import type React from "react";
import { requireAuth } from "@/lib/auth-server";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ClientHeaderNav } from "@/components/client-header-nav";
import { MobileLayout } from "@/components/mobile-layout";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // Use mobile layout for clients, header navigation for desktop
  if (user.role === "client") {
    return (
      <>
        {/* Desktop layout */}
        <div className="hidden md:block min-h-screen bg-background">
          <ClientHeaderNav user={user} />
          <main className="container mx-auto max-w-7xl px-6 py-6">
            {children}
          </main>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          <MobileLayout user={user}>{children}</MobileLayout>
        </div>

        <Toaster />
      </>
    );
  }

  // Staff layout with header + sidebar
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar user={user} />
        <SidebarInset className="flex flex-col">
          <SiteHeader />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
