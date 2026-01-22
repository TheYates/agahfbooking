# Convex Quick Start

## Running the Development Environment

### Terminal 1: Convex Backend
```bash
bun run convex:dev
```

### Terminal 2: Next.js Frontend
```bash
bun run dev
```

## Common Commands

| Command | Description |
|---------|-------------|
| `bun run convex:dev` | Start Convex development server with hot reload |
| `bun run convex:deploy` | Deploy to production Convex deployment |
| `bun run convex:codegen` | Regenerate TypeScript types |
| `bun run dev` | Start Next.js development server |

## File Structure

```
convex/
├── schema.ts              # Database schema definition
├── auth.ts                # Authentication configuration
├── queries/               # Read operations (will be created in Task 6)
│   ├── appointments.ts
│   ├── clients.ts
│   └── departments.ts
├── mutations/             # Write operations (will be created in Task 7)
│   ├── appointments.ts
│   ├── clients.ts
│   └── departments.ts
├── actions/               # External API calls (will be created in Task 10)
│   └── sms.ts
└── services/              # Shared utilities (will be created as needed)
    ├── hubtel.ts
    └── jwtOtp.ts
```

## Development Workflow

1. **Make changes** to files in `convex/` directory
2. **Save the file** - Convex dev server automatically deploys
3. **Check terminal** for deployment status and any errors
4. **Test in browser** - Changes are live immediately

## Key Concepts

### Queries (Read Operations)
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getClient = query({
  args: { xNumber: v.string() },
  handler: async (ctx, { xNumber }) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_x_number", (q) => q.eq("x_number", xNumber))
      .first();
  },
});
```

### Mutations (Write Operations)
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createClient = mutation({
  args: {
    xNumber: v.string(),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clients", {
      x_number: args.xNumber,
      name: args.name,
      phone: args.phone,
      is_active: true,
    });
  },
});
```

### Actions (External APIs)
```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendSMS = action({
  args: {
    to: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { to, message }) => {
    // Call external API (e.g., Hubtel)
    const response = await fetch("https://api.hubtel.com/...", {
      method: "POST",
      body: JSON.stringify({ to, message }),
    });
    return await response.json();
  },
});
```

## Testing

Property-based tests will be created using `fast-check` alongside implementation files.

Example test structure:
```typescript
// convex/mutations/appointments.test.ts
import * as fc from "fast-check";

describe("Appointment Booking", () => {
  it("should prevent double-booking", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.date(),
        fc.integer({ min: 1, max: 10 }),
        async (departmentId, date, slot) => {
          // Property test logic
        }
      )
    );
  });
});
```

## Troubleshooting

### Types not updating
```bash
bun run convex:codegen
```

### Deployment errors
Check the Convex dev server terminal for detailed error messages.

### Environment variables not loading
Restart both Convex and Next.js dev servers after changing `.env.local`.

## Next Steps

Proceed to Task 2: Define Convex Schema in the migration plan.
