# Convex Quick Start Guide

## 🚀 Getting Started (3 Steps)

### 1. Initialize Convex
```bash
npx convex dev
```
This will:
- Create your Convex project
- Generate `NEXT_PUBLIC_CONVEX_URL`
- Deploy schema and functions
- Start watching for changes

### 2. Add Environment Variable
Copy the URL from the terminal output to `.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 3. Seed Initial Data
```bash
npx convex run actions:seedInitialData
```

## 📝 Common Patterns

### Fetching Data (Queries)

```tsx
import { useClients, useDepartments, useAppointments } from "@/hooks/use-convex-queries";

function MyComponent() {
  // Simple query
  const clients = useClients();
  
  // Query with filters
  const activeClients = useClients({ isActive: true });
  
  // Query with search
  const searchResults = useClients({ search: "John" });
  
  // Department appointments
  const appointments = useAppointments({ 
    department_id: departmentId,
    date: "2024-01-23" 
  });
  
  // Loading states
  if (clients === undefined) return <div>Loading...</div>;
  if (clients.length === 0) return <div>No clients found</div>;
  
  return <div>{clients.map(c => <div key={c._id}>{c.name}</div>)}</div>;
}
```

### Creating Data (Mutations)

```tsx
import { useCreateClient, useCreateAppointment } from "@/hooks/use-convex-queries";
import { toast } from "sonner";

function CreateClientForm() {
  const createClient = useCreateClient();
  
  const handleSubmit = async (data) => {
    try {
      const clientId = await createClient({
        x_number: data.xNumber,
        name: data.name,
        phone: data.phone,
        category: data.category,
      });
      
      toast.success("Client created successfully!");
      // No need to refetch - Convex updates automatically!
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Authentication

```tsx
import { useConvexAuth } from "@/hooks/use-convex-auth";

function LoginPage() {
  const { sendOTP, verifyOTP, user, isAuthenticated, logout } = useConvexAuth();
  
  // Send OTP
  const handleSendOTP = async () => {
    try {
      const result = await sendOTP("X12345/67", "client");
      toast.success("OTP sent!");
      // In dev mode, result.otp contains the code
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  // Verify OTP
  const handleVerify = async (otp) => {
    try {
      await verifyOTP("X12345/67", otp, "client");
      toast.success("Logged in!");
      // user is now set automatically
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  // Check authentication
  if (isAuthenticated) {
    return <div>Welcome, {user.name}!</div>;
  }
  
  return <LoginForm />;
}
```

### Real-time Updates

```tsx
import { useAppointments } from "@/hooks/use-convex-queries";

function AppointmentsList() {
  // This automatically updates when appointments change!
  const appointments = useAppointments({ 
    date: new Date().toISOString().split('T')[0] 
  });
  
  // No polling, no manual refetch needed
  return (
    <div>
      {appointments?.map(apt => (
        <AppointmentCard key={apt._id} appointment={apt} />
      ))}
    </div>
  );
}
```

### Working with IDs

```tsx
import { Id } from "@/convex/_generated/dataModel";
import { useAppointmentWithDetails } from "@/hooks/use-convex-queries";

function AppointmentDetails({ id }: { id: Id<"appointments"> }) {
  // Type-safe ID usage
  const appointment = useAppointmentWithDetails(id);
  
  if (!appointment) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Client: {appointment.client?.name}</h2>
      <p>Department: {appointment.department?.name}</p>
      <p>Doctor: {appointment.doctor?.name || "Not assigned"}</p>
    </div>
  );
}
```

## 🔄 Migration Checklist

### Component Migration Steps

For each component that uses PostgreSQL:

1. **Replace imports**
   ```tsx
   // ❌ Old
   import { useQuery } from "@tanstack/react-query";
   
   // ✅ New
   import { useClients } from "@/hooks/use-convex-queries";
   ```

2. **Update data fetching**
   ```tsx
   // ❌ Old
   const { data, isLoading } = useQuery({
     queryKey: ["clients"],
     queryFn: () => fetch("/api/clients").then(r => r.json())
   });
   
   // ✅ New
   const clients = useClients();
   const isLoading = clients === undefined;
   ```

3. **Update mutations**
   ```tsx
   // ❌ Old
   const mutation = useMutation({
     mutationFn: (data) => fetch("/api/clients", { 
       method: "POST", 
       body: JSON.stringify(data) 
     }),
     onSuccess: () => queryClient.invalidateQueries(["clients"])
   });
   
   // ✅ New
   const createClient = useCreateClient();
   // Auto-updates, no invalidation needed!
   ```

4. **Update authentication**
   ```tsx
   // ❌ Old
   import { useSession } from "@/lib/auth-client";
   const { data: session } = useSession();
   
   // ✅ New
   import { useConvexAuth } from "@/hooks/use-convex-auth";
   const { user, isAuthenticated } = useConvexAuth();
   ```

5. **Test the component**
   - Verify data loads correctly
   - Test mutations work
   - Check real-time updates
   - Test error handling

### Pages to Migrate (Priority Order)

1. ✅ Root layout (Done - using ConvexClientProvider)
2. Dashboard home page
3. Clients page
4. Appointments page
5. Calendar page
6. Departments page
7. Users page
8. Settings pages
9. Login/auth pages

## 🎯 Key Benefits

### Before (PostgreSQL + TanStack Query)
```tsx
// Lots of boilerplate
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["clients", filters],
  queryFn: async () => {
    const res = await fetch("/api/clients?" + new URLSearchParams(filters));
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },
  refetchInterval: 30000, // Poll every 30s
});

// Manual invalidation
const mutation = useMutation({
  mutationFn: (data) => fetch("/api/clients", {...}),
  onSuccess: () => {
    queryClient.invalidateQueries(["clients"]);
    queryClient.invalidateQueries(["dashboard"]);
  }
});
```

### After (Convex)
```tsx
// Simple and reactive
const clients = useClients(filters);

// Auto-updates everywhere
const createClient = useCreateClient();
await createClient(data); // All components update automatically!
```

## 🛠️ Development Tips

### View Real-time Data
Open Convex Dashboard: `https://dashboard.convex.dev`
- See all data in tables
- Run queries directly
- Monitor function calls
- View logs

### Debug Queries
```tsx
const clients = useClients();
console.log("Clients:", clients); // undefined = loading, [] = empty, [...] = data
```

### Type Safety
```tsx
import { Id } from "@/convex/_generated/dataModel";

// ✅ Type-safe
const id: Id<"clients"> = "...";

// ❌ Won't compile
const id: Id<"clients"> = 123; // Error: must be string
```

### Error Handling
```tsx
const createClient = useCreateClient();

try {
  await createClient(data);
} catch (error) {
  // Convex errors have descriptive messages
  console.error(error.message); // "Client with this X-number already exists"
}
```

## 📦 Next Steps

1. Run `npx convex dev`
2. Copy the URL to `.env.local`
3. Run `npx convex run actions:seedInitialData`
4. Start migrating components one by one
5. Test thoroughly
6. Remove PostgreSQL when done

## 🆘 Need Help?

- Check `CONVEX_MIGRATION.md` for detailed migration guide
- View Convex docs: https://docs.convex.dev/
- Check the generated API types in `convex/_generated/api.d.ts`
