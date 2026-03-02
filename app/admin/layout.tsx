import type React from "react";
import { requireAdminAuth } from "@/lib/auth-server";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsProvider } from "@/components/notifications/notifications-provider";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminAuth();

  return (
    <NotificationsProvider>
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
    </NotificationsProvider>
  );
}
