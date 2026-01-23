# Convex Setup Guide

This document provides instructions for setting up and configuring Convex for the AGAHF Hospital Booking Application migration.

## Prerequisites

- Node.js 20 or higher
- Bun package manager
- A Convex account (sign up at https://convex.dev)

## Installation Complete ✅

The following dependencies have been installed:
- `convex` (v1.31.6) - Convex backend platform
- `@convex-dev/auth` (v0.0.90) - Convex authentication library
- `fast-check` (v4.5.3) - Property-based testing library

## Project Structure

```
convex/
├── _generated/          # Auto-generated TypeScript types (gitignored)
├── auth.ts             # Authentication configuration (placeholder)
├── schema.ts           # Database schema (placeholder)
├── setup-check.ts      # Health check query
├── tsconfig.json       # TypeScript configuration
└── README.md           # Convex backend documentation
```

## Configuration

### 1. Environment Variables

The following environment variables are configured in `.env.local`:

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=dev:lovable-manatee-131
NEXT_PUBLIC_CONVEX_URL=https://lovable-manatee-131.convex.cloud
```

### 2. Convex Configuration File

`convex.json` has been created with Node.js 20 runtime configuration.

### 3. NPM Scripts

The following scripts have been added to `package.json`:

```json
{
  "convex:dev": "convex dev",
  "convex:deploy": "convex deploy",
  "convex:codegen": "convex codegen"
}
```

## Getting Started

### Step 1: Start Convex Development Server

```bash
bun run convex:dev
```

This will:
- Connect to your Convex deployment
- Watch for changes in the `convex/` directory
- Automatically deploy functions and schema updates
- Generate TypeScript types in `convex/_generated/`

### Step 2: Verify Setup

Once the Convex dev server is running, you can verify the setup by:

1. Checking that the `convex/_generated/` directory is populated with type definitions
2. Running the health check query (once the dev server is running)

### Step 3: Start Next.js Development Server

In a separate terminal:

```bash
bun run dev
```

## Next Steps

Now that the Convex project is initialized, you can proceed with:

1. **Task 2**: Define Convex Schema - Create the complete database schema
2. **Task 3**: Implement Authentication System - Set up Convex Auth
3. **Task 4+**: Continue with the migration tasks as outlined in `.kiro/specs/postgres-to-convex-migration/tasks.md`

## Troubleshooting

### Issue: Convex dev server won't start

**Solution**: Ensure you have a valid Convex account and the deployment URL is correct in `.env.local`

### Issue: TypeScript errors in convex/ directory

**Solution**: Run `bun run convex:codegen` to regenerate type definitions

### Issue: Environment variables not loading

**Solution**: Restart both the Convex dev server and Next.js dev server after changing `.env.local`

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [Fast-check Documentation](https://fast-check.dev)
- [Migration Spec](.kiro/specs/postgres-to-convex-migration/)

## Migration Status

✅ Task 1: Project Setup and Configuration - **COMPLETE**
- Convex project initialized
- Dependencies installed (@convex-dev/auth, fast-check)
- Environment variables configured
- Development environment ready

Next: Task 2 - Define Convex Schema
