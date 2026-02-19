import type React from "react";
import { requireAuth } from "@/lib/auth-server";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ClientHeaderNav } from "@/components/client-header-nav";
import { MobileLayout } from "@/components/mobile-layout";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsProvider } from "@/components/notifications/notifications-provider";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { InactivityProvider } from "@/components/providers/inactivity-provider";

// Force dynamic rendering for all dashboard pages since they use authentication
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

return (
    <NotificationsProvider>
      <InactivityProvider>
        {/* Client layout */}
        {user.role === "client" && (
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

            {/* Feedback Button */}
            <FeedbackButton />

            <Toaster />
          </>
        )}

        {/* Reviewer layout */}
        {user.role === "reviewer" && (
          <>
            {/* Desktop Layout (Sidebar) */}
            <div className="hidden lg:flex min-h-screen w-full">
              <SidebarProvider defaultOpen={true}>
                <AppSidebar user={user} />
                <SidebarInset className="flex flex-col">
                  <SiteHeader />
                  <main className="flex-1 p-6">{children}</main>
                </SidebarInset>
              </SidebarProvider>
            </div>

            {/* Mobile Layout (Bottom Nav) */}
            <div className="lg:hidden">
              <MobileLayout user={user}>{children}</MobileLayout>
            </div>

            <Toaster />
          </>
        )}

        {/* Default Staff layout (Admin/Receptionist) */}
        {(user.role === "admin" || user.role === "receptionist") && (
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
        )}
      </InactivityProvider>
    </NotificationsProvider>
  );
}
