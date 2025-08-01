"use client";

import * as React from "react";
import {
  Search,
  Calendar,
  Users,
  Building2,
  FileText,
  User,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchFormProps {
  className?: string;
}

interface SearchResults {
  appointments: Array<{
    id: number;
    date: string;
    slotNumber: number;
    status: string;
    clientName: string;
    clientXNumber: string;
    doctorName: string;
    departmentName: string;
    departmentColor: string;
  }>;
  clients: Array<{
    id: number;
    name: string;
    xNumber: string;
    phone: string;
    category: string;
  }>;
  doctors: Array<{
    id: number;
    name: string;
    specialization: string;
    departmentName: string;
    departmentColor: string;
  }>;
  departments: Array<{
    id: number;
    name: string;
    description: string;
    color: string;
  }>;
}

export function SearchForm({ className }: SearchFormProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResults>({
    appointments: [],
    clients: [],
    doctors: [],
    departments: [],
  });
  const [isSearching, setIsSearching] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({
        appointments: [],
        clients: [],
        doctors: [],
        departments: [],
      });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/search/universal?q=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search hospital...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search appointments, clients, doctors..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching
              ? "Searching..."
              : searchQuery.length < 2
              ? "Type at least 2 characters to search..."
              : "No results found."}
          </CommandEmpty>

          {/* Search Results */}
          {searchResults.appointments.length > 0 && (
            <CommandGroup heading="Appointments">
              {searchResults.appointments.map((appointment) => (
                <CommandItem
                  key={`appointment-${appointment.id}`}
                  onSelect={() =>
                    runCommand(() => router.push("/dashboard/appointments"))
                  }
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {appointment.clientName} - {appointment.departmentName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(appointment.date).toLocaleDateString()} • Slot{" "}
                      {appointment.slotNumber} • {appointment.status}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults.clients.length > 0 && (
            <CommandGroup heading="Clients">
              {searchResults.clients.map((client) => (
                <CommandItem
                  key={`client-${client.id}`}
                  onSelect={() =>
                    runCommand(() => router.push("/dashboard/clients"))
                  }
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {client.xNumber} • {client.phone} • {client.category}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults.doctors.length > 0 && (
            <CommandGroup heading="Doctors">
              {searchResults.doctors.map((doctor) => (
                <CommandItem
                  key={`doctor-${doctor.id}`}
                  onSelect={() =>
                    runCommand(() => router.push("/dashboard/departments"))
                  }
                >
                  <Stethoscope className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Dr. {doctor.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {doctor.specialization} • {doctor.departmentName}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults.departments.length > 0 && (
            <CommandGroup heading="Departments">
              {searchResults.departments.map((department) => (
                <CommandItem
                  key={`department-${department.id}`}
                  onSelect={() =>
                    runCommand(() => router.push("/dashboard/departments"))
                  }
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{department.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {department.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Quick Actions - only show when no search query */}
          {!searchQuery.trim() && (
            <>
              <CommandGroup heading="Quick Actions">
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push("/dashboard/appointments"))
                  }
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>View Appointments</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push("/dashboard/clients"))
                  }
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Manage Clients</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push("/dashboard/departments"))
                  }
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>View Departments</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push("/dashboard/calendar"))
                  }
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Open Calendar</span>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Navigation">
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/dashboard"))}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push("/dashboard/reports"))
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Reports</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
