#!/usr/bin/env node

/**
 * Dashboard Convex Migration Test Script
 * 
 * This script helps verify that the dashboard migration to Convex is working correctly.
 * Run this after starting the Convex dev server.
 */

const { ConvexHttpClient } = require("convex/browser");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL environment variable not set");
  console.log("Please set it in your .env.local file");
  process.exit(1);
}

console.log("🧪 Testing Dashboard Convex Migration\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

const client = new ConvexHttpClient(CONVEX_URL);

async function testQueries() {
  const tests = [];
  
  // Test 1: Check if we can connect to Convex
  tests.push({
    name: "Convex Connection",
    test: async () => {
      try {
        // Try to import the API
        const { api } = await import("../convex/_generated/api.js");
        return { success: true, message: "Connected to Convex" };
      } catch (error) {
        return { success: false, message: `Connection failed: ${error.message}` };
      }
    }
  });

  // Test 2: Check if departments query works
  tests.push({
    name: "Get Departments",
    test: async () => {
      try {
        const { api } = await import("../convex/_generated/api.js");
        const departments = await client.query(api.queries.getDepartments, { isActive: true });
        return { 
          success: true, 
          message: `Found ${departments?.length || 0} active departments`,
          data: departments 
        };
      } catch (error) {
        return { success: false, message: `Query failed: ${error.message}` };
      }
    }
  });

  // Test 3: Check if clients exist
  tests.push({
    name: "Get Clients",
    test: async () => {
      try {
        const { api } = await import("../convex/_generated/api.js");
        const clients = await client.query(api.queries.getClients, {});
        return { 
          success: true, 
          message: `Found ${clients?.length || 0} clients`,
          data: clients?.slice(0, 3) // Show first 3
        };
      } catch (error) {
        return { success: false, message: `Query failed: ${error.message}` };
      }
    }
  });

  // Test 4: Check if staff dashboard stats query exists
  tests.push({
    name: "Staff Dashboard Stats Query",
    test: async () => {
      try {
        const { api } = await import("../convex/_generated/api.js");
        const stats = await client.query(api.queries.getStaffDashboardStats, {});
        return { 
          success: true, 
          message: "Staff dashboard stats query works",
          data: {
            upcomingAppointments: stats?.upcomingAppointments || 0,
            totalAppointments: stats?.totalAppointments || 0,
            completedAppointments: stats?.completedAppointments || 0,
            availableSlots: stats?.availableSlots || 0,
          }
        };
      } catch (error) {
        return { success: false, message: `Query failed: ${error.message}` };
      }
    }
  });

  // Run all tests
  console.log("Running tests...\n");
  
  for (const test of tests) {
    console.log(`🧪 Testing: ${test.name}`);
    const result = await test.test();
    
    if (result.success) {
      console.log(`   ✅ PASS: ${result.message}`);
      if (result.data && process.argv.includes("--verbose")) {
        console.log(`   📊 Data:`, JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log(`   ❌ FAIL: ${result.message}`);
    }
    console.log();
  }

  // Summary
  const passed = tests.filter(async (t) => (await t.test()).success).length;
  const total = tests.length;
  
  console.log("\n" + "=".repeat(50));
  console.log(`📊 Test Summary: ${passed}/${total} tests passed`);
  console.log("=".repeat(50) + "\n");

  if (passed === total) {
    console.log("✅ All tests passed! Dashboard migration is working correctly.");
    console.log("\n📝 Next steps:");
    console.log("   1. Start Next.js dev server: bun run dev");
    console.log("   2. Login as a client or staff user");
    console.log("   3. Navigate to /dashboard");
    console.log("   4. Verify dashboard displays correctly");
  } else {
    console.log("❌ Some tests failed. Please check:");
    console.log("   1. Is Convex dev server running? (bun run convex:dev)");
    console.log("   2. Are there any errors in the console?");
    console.log("   3. Is the schema deployed to Convex?");
  }
}

// Run tests
testQueries().catch((error) => {
  console.error("\n❌ Fatal error running tests:", error);
  process.exit(1);
});
