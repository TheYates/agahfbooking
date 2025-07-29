import type React from "react"
import { requireAuth } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} />
      <SidebarInset>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
