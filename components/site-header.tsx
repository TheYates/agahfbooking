"use client"

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
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
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
        'users': 'Users',
        'reports': 'Reports',
        'settings': 'Settings',
        'profile': 'Profile',
        'test-sms': 'Test SMS'
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
        <SidebarTrigger className="h-8 w-8" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
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
