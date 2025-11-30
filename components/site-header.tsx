"use client"

import { SidebarIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import { SearchForm } from "@/components/search-form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (segments.length === 0 || segments[0] !== 'dashboard') {
      return null
    }

    const breadcrumbs = [
      { label: 'Dashboard', href: '/dashboard' }
    ]

    if (segments.length > 1) {
      const section = segments[1]
      const sectionLabels: Record<string, string> = {
        'appointments': 'Appointments',
        'my-appointments': 'My Appointments',
        'calendar': 'Calendar',
        'clients': 'Clients',
        'departments': 'Departments',
        'reports': 'Reports',
        'settings': 'Settings',
        'profile': 'Profile'
      }

      if (sectionLabels[section]) {
        breadcrumbs.push({
          label: sectionLabels[section],
          href: `/dashboard/${section}`
        })
      }

      // Add subsection if exists
      if (segments.length > 2) {
        const subsection = segments[2]
        const subsectionLabels: Record<string, string> = {
          'add': 'Add New',
          'edit': 'Edit',
          'view': 'View Details'
        }

        if (subsectionLabels[subsection]) {
          breadcrumbs.push({
            label: subsectionLabels[subsection],
            href: pathname
          })
        }
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-14 w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />

        {/* Logo - visible on all screen sizes */}
        <div className="flex items-center gap-2">
          <img
            src="/agahflogo.svg"
            alt="AGAHF Logo"
            className="h-6 w-6 dark:hidden"
          />
          <img
            src="/agahflogo white.svg"
            alt="AGAHF Logo"
            className="h-6 w-6 hidden dark:block"
          />
          <span className="font-semibold text-sm hidden sm:inline">AGAHF BOOKING</span>
        </div>
        
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
      </div>
    </header>
  )
}
