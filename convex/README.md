# Convex Functions

This directory contains all Convex backend functions for the AGAHF Booking System.

## 📁 Structure

```
convex/
├── schema.ts           # Database schema definition
├── auth.ts            # Authentication functions (OTP, login)
├── queries.ts         # Read operations (SELECT equivalent)
├── mutations.ts       # Write operations (INSERT/UPDATE/DELETE equivalent)
├── actions.ts         # External integrations (SMS, reports)
├── http.ts            # HTTP endpoints (webhooks, health checks)
└── _generated/        # Auto-generated types (don't edit)
    ├── api.d.ts       # Function references
    └── dataModel.d.ts # Schema types
```

## 🔧 Function Types

### Queries (queries.ts)
Read-only operations that run on the database.
- Reactive: automatically re-run when data changes
- Cached: same query with same args returns cached result
- Examples: `getClients`, `getAppointments`, `getDashboardStats`

### Mutations (mutations.ts)
Write operations that modify the database.
- Transactional: all-or-nothing execution
- Invalidate caches: trigger query updates
- Examples: `createClient`, `updateAppointment`, `cancelAppointment`

### Actions (actions.ts)
Operations that call external services.
- Can call queries/mutations
- Can make HTTP requests
- Examples: `sendSMS`, `generateReport`, `seedInitialData`

### HTTP Routes (http.ts)
Public HTTP endpoints for webhooks and integrations.
- Accessible without authentication
- Examples: `/health`, `/webhooks/sms-status`

## 🎯 Usage Examples

### From React Components

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  // Query
  const clients = useQuery(api.queries.getClients, { isActive: true });
  
  // Mutation
  const createClient = useMutation(api.mutations.createClient);
  
  const handleCreate = async () => {
    await createClient({
      x_number: "X12345/67",
      name: "John Doe",
      phone: "+233123456789",
      category: "PRIVATE CASH"
    });
  };
}
```

### From Actions

```tsx
// Inside an action
export const myAction = action({
  handler: async (ctx, args) => {
    // Call a query
    const clients = await ctx.runQuery(api.queries.getClients, {});
    
    // Call a mutation
    const id = await ctx.runMutation(api.mutations.createClient, {...});
    
    // Make external HTTP request
    const response = await fetch("https://api.example.com/...");
  }
});
```

## 📋 Available Functions

### Authentication (auth.ts)
- `sendOTP` - Generate and send OTP
- `verifyOTP` - Verify OTP and create session
- `staffLogin` - Login with employee_id and password
- `getCurrentUser` - Get current staff user
- `getCurrentClient` - Get current client
- `logout` - Clear session

### Queries (queries.ts)

**Users**
- `getUsers` - List all staff users
- `getUserById` - Get user by ID
- `getUserByEmployeeId` - Get user by employee ID

**Clients**
- `getClients` - List clients (with filters)
- `getClientById` - Get client by ID
- `getClientByXNumber` - Get client by X-number
- `getClientStats` - Get client statistics

**Departments**
- `getDepartments` - List departments
- `getDepartmentById` - Get department by ID
- `getDepartmentWithStats` - Get department with appointment stats

**Doctors**
- `getDoctors` - List doctors
- `getDoctorById` - Get doctor by ID

**Appointments**
- `getAppointments` - List appointments (with filters)
- `getAppointmentById` - Get appointment by ID
- `getAppointmentWithDetails` - Get appointment with related data
- `getAvailableSlots` - Get available slots for a department/date

**Dashboard**
- `getDashboardStats` - Get dashboard statistics
- `getSystemSettings` - Get all system settings
- `getSystemSetting` - Get specific setting

**Search**
- `universalSearch` - Search across clients, departments, doctors

### Mutations (mutations.ts)

**Users**
- `createUser` - Create new staff user
- `updateUser` - Update user details
- `deleteUser` - Delete user
- `toggleUserActive` - Toggle user active status

**Clients**
- `createClient` - Create new client
- `updateClient` - Update client details
- `deleteClient` - Delete client

**Departments**
- `createDepartment` - Create new department
- `updateDepartment` - Update department
- `deleteDepartment` - Delete department

**Doctors**
- `createDoctor` - Create new doctor
- `updateDoctor` - Update doctor
- `deleteDoctor` - Delete doctor

**Appointments**
- `createAppointment` - Book new appointment
- `updateAppointment` - Update appointment details
- `cancelAppointment` - Cancel appointment
- `rescheduleAppointment` - Reschedule to new date/slot
- `deleteAppointment` - Delete appointment

**Settings**
- `updateSystemSetting` - Update or create system setting
- `setDepartmentAvailability` - Set department availability for a date

### Actions (actions.ts)

**SMS**
- `sendSMS` - Send SMS via Hubtel
- `sendOTPSMS` - Send OTP via SMS
- `sendAppointmentConfirmationSMS` - Send appointment confirmation
- `sendAppointmentReminderSMS` - Send appointment reminder

**Reports**
- `generateAppointmentReport` - Generate appointment report

**Setup**
- `seedInitialData` - Seed default data (settings, statuses)

## 🔐 Authentication Pattern

```tsx
// Store user in localStorage after successful auth
const { user } = await verifyOTP(...);
localStorage.setItem("convex_user", JSON.stringify(user));

// Check auth in components
const userStr = localStorage.getItem("convex_user");
const user = userStr ? JSON.parse(userStr) : null;

// Pass user ID to queries that need auth
const appointments = useQuery(api.queries.getAppointments, {
  client_id: user?.id
});
```

## 🚀 Deployment

### Development
```bash
npx convex dev
```

### Production
```bash
npx convex deploy --prod
```

## 📝 Adding New Functions

1. Add function to appropriate file (queries.ts, mutations.ts, actions.ts)
2. Define args with `v` validators
3. Implement handler
4. Save - Convex auto-deploys on save during `npx convex dev`

Example:
```tsx
export const myNewQuery = query({
  args: {
    name: v.string(),
    age: v.number(),
  },
  handler: async (ctx, args) => {
    // Your logic here
    return await ctx.db.query("users").collect();
  },
});
```

## 🎨 Best Practices

1. **Use indexes** - Define in schema.ts for better performance
2. **Validate inputs** - Use Convex validators (`v.string()`, etc.)
3. **Handle errors** - Throw descriptive error messages
4. **Keep queries simple** - Complex logic in actions
5. **Use transactions** - Mutations are automatically transactional
6. **Add comments** - Document complex logic

## 📚 Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Schema Design](https://docs.convex.dev/database/schemas)
- [Writing Functions](https://docs.convex.dev/functions)
- [Best Practices](https://docs.convex.dev/production/best-practices)
