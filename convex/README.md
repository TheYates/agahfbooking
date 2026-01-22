# Convex Backend

This directory contains the Convex backend for the AGAHF Hospital Booking Application.

## Setup

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Update `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` with your Convex project details
   - Get these values by running `bun run convex:dev` and following the setup wizard

3. **Start Convex Development Server**
   ```bash
   bun run convex:dev
   ```
   This will:
   - Watch for changes in the `convex/` directory
   - Automatically deploy functions and schema updates
   - Generate TypeScript types in `convex/_generated/`

4. **Run Next.js Development Server** (in a separate terminal)
   ```bash
   bun run dev
   ```

## Project Structure

```
convex/
├── _generated/          # Auto-generated TypeScript types (do not edit)
├── auth.ts             # Authentication configuration (Convex Auth)
├── schema.ts           # Database schema definition
├── queries/            # Query functions (read operations)
├── mutations/          # Mutation functions (write operations)
├── actions/            # Action functions (external API calls)
├── services/           # Shared business logic and utilities
└── README.md           # This file
```

## Development Workflow

1. **Define Schema** - Update `schema.ts` with table definitions
2. **Write Functions** - Create queries, mutations, and actions
3. **Test Locally** - Use `convex:dev` to test changes in real-time
4. **Deploy** - Run `bun run convex:deploy` to deploy to production

## Key Concepts

- **Queries**: Read-only operations that can be subscribed to for real-time updates
- **Mutations**: Write operations that modify the database
- **Actions**: Functions that can call external APIs (e.g., Hubtel SMS)
- **Schema**: Type-safe database schema with automatic validation

## Testing

Property-based tests using `fast-check` are located in the test files alongside the implementation.

Run tests with:
```bash
bun test
```

## Migration Status

This backend is part of the PostgreSQL to Convex migration. See `.kiro/specs/postgres-to-convex-migration/` for the full migration plan.
