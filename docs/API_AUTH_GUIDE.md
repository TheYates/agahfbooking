# X-Number Authentication Guide

This guide shows how to secure your API routes with x-number based authentication.

## Quick Start

### 1. Simple Protected Route

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { withAuth, type SessionData } from "@/lib/api-auth";

async function myHandler(request: NextRequest, session: SessionData) {
  // Session is already validated here!
  console.log(`User ${session.name} (${session.role}) is accessing this route`);
  
  return NextResponse.json({ 
    message: "Success", 
    user: session.name 
  });
}

// Require any authenticated user
export const GET = withAuth(myHandler);
```

### 2. Client-Only Route

```typescript
import { withAuth } from "@/lib/api-auth";

async function clientHandler(request: NextRequest, session: SessionData) {
  // Only clients can reach here
  return NextResponse.json({ 
    xNumber: session.xNumber,
    name: session.name 
  });
}

// Only clients (x-number users) can access
export const GET = withAuth(clientHandler, { requireClient: true });
```

### 3. Staff-Only Route

```typescript
import { withAuth } from "@/lib/api-auth";

async function staffHandler(request: NextRequest, session: SessionData) {
  // Only staff can reach here
  return NextResponse.json({ 
    role: session.role,
    canAccess: true 
  });
}

// Only staff (receptionist, admin, reviewer) can access
export const GET = withAuth(staffHandler, { requireStaff: true });
```

### 4. Admin-Only Route

```typescript
import { withAuth } from "@/lib/api-auth";

async function adminHandler(request: NextRequest, session: SessionData) {
  // Only admins can reach here
  return NextResponse.json({ admin: true });
}

// Only admins can access
export const GET = withAuth(adminHandler, { requireAdmin: true });
```

## X-Number Validation

### Ensure Client Can Only Access Their Own Data

```typescript
import { withAuth, validateXNumberAccess, AuthErrors } from "@/lib/api-auth";

async function getClientData(request: NextRequest, session: SessionData) {
  const { searchParams } = new URL(request.url);
  const requestedXNumber = searchParams.get("xNumber");
  
  if (!requestedXNumber) {
    return AuthErrors.invalidXNumber();
  }
  
  // This checks:
  // - If staff: returns true (staff can access any x-number)
  // - If client: returns true only if session.xNumber === requestedXNumber
  if (!validateXNumberAccess(session, requestedXNumber)) {
    return AuthErrors.xNumberMismatch();
  }
  
  // Safe to fetch data for this x-number
  const data = await fetchClientData(requestedXNumber);
  
  return NextResponse.json({ success: true, data });
}

export const GET = withAuth(getClientData, { requireClient: true });
```

## Session Data Structure

```typescript
interface SessionData {
  id: number;                    // User/Client ID
  xNumber?: string;             // Only for clients
  name: string;                 // User name
  phone?: string;               // Phone number
  category?: string;            // Client category
  role: "client" | "receptionist" | "admin" | "reviewer";
  username?: string;            // Only for staff
  employee_id?: string;         // Deprecated
  loginTime: string;            // ISO timestamp
}
```

## Using Supabase with Auth

### Admin Client (Bypasses RLS)

Use for all database operations in API routes:

```typescript
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function handler(request: NextRequest, session: SessionData) {
  const supabase = createAdminSupabaseClient();
  
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("client_id", session.id);
    
  // ... handle response
}
```

### Always Filter by X-Number for Clients

```typescript
async function handler(request: NextRequest, session: SessionData) {
  const supabase = createAdminSupabaseClient();
  
  // If client, always filter by their x-number
  let query = supabase.from("appointments").select("*");
  
  if (session.role === "client" && session.xNumber) {
    // Get client ID first
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("x_number", session.xNumber)
      .single();
      
    query = query.eq("client_id", client?.id);
  }
  
  const { data } = await query;
  return NextResponse.json({ data });
}
```

## Common Patterns

### 1. Get Current User's Appointments

```typescript
import { withAuth, type SessionData } from "@/lib/api-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function getMyAppointments(request: NextRequest, session: SessionData) {
  const supabase = createAdminSupabaseClient();
  
  let clientId = session.id;
  
  // If client, get their ID from x-number
  if (session.role === "client" && session.xNumber) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("x_number", session.xNumber)
      .single();
    clientId = client?.id;
  }
  
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, departments(name)")
    .eq("client_id", clientId)
    .order("appointment_date", { ascending: false });
    
  return NextResponse.json({ appointments });
}

export const GET = withAuth(getMyAppointments);
```

### 2. Create Appointment (Client or Staff)

```typescript
import { withAuth, validateXNumberAccess, AuthErrors } from "@/lib/api-auth";

async function createAppointment(request: NextRequest, session: SessionData) {
  const body = await request.json();
  const { xNumber, departmentId, appointmentDate, slotNumber } = body;
  
  // Validate x-number access
  if (!validateXNumberAccess(session, xNumber)) {
    return AuthErrors.xNumberMismatch();
  }
  
  // ... rest of the logic
}

// Allow both clients and staff
export const POST = withAuth(createAppointment);
```

### 3. Admin-Only User Management

```typescript
import { withAuth } from "@/lib/api-auth";

async function createUser(request: NextRequest, session: SessionData) {
  // Only admins reach here due to { requireAdmin: true }
  const body = await request.json();
  
  // Create user logic...
  
  return NextResponse.json({ success: true });
}

export const POST = withAuth(createUser, { requireAdmin: true });
```

## Error Responses

The auth helpers return standard HTTP errors:

- `401 Unauthorized` - No valid session
- `403 Forbidden` - Wrong role or x-number mismatch
- `400 Bad Request` - Invalid x-number format

Example error response:
```json
{
  "error": "Forbidden - Can only access your own data"
}
```

## Testing Protected Routes

### Without Auth (Should Fail)
```bash
curl http://localhost:3000/api/protected-route
# Response: { "error": "Unauthorized - Please login" }
```

### With Valid Session (Should Work)
Login first, then:
```bash
curl -H "Cookie: session_token=YOUR_TOKEN" \
  http://localhost:3000/api/protected-route
```

## Security Checklist

- [ ] All sensitive API routes use `withAuth()`
- [ ] Client routes validate x-number access with `validateXNumberAccess()`
- [ ] Using `createAdminSupabaseClient()` in API routes (not browser client)
- [ ] Filtering data by x-number for client queries
- [ ] Admin routes use `{ requireAdmin: true }`
- [ ] Staff routes use `{ requireStaff: true }`
- [ ] Client routes use `{ requireClient: true }`

## Migration Guide

To secure existing API routes:

1. Import the auth helpers:
   ```typescript
   import { withAuth } from "@/lib/api-auth";
   ```

2. Wrap your handler with `withAuth`:
   ```typescript
   // Before
   export async function GET(request: NextRequest) {
     // handler code
   }
   
   // After
   async function handler(request: NextRequest, session: SessionData) {
     // handler code
   }
   export const GET = withAuth(handler);
   ```

3. Add role restrictions if needed:
   ```typescript
   export const GET = withAuth(handler, { requireClient: true });
   ```

4. Use Supabase admin client for database operations

5. Validate x-number access for client-specific data
