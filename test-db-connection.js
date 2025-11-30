// Test Supabase Database Connection
// Run with: node test-db-connection.js

const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

console.log("🔍 Testing Supabase Database Connection...\n");

// Test configuration
const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
};

console.log("📋 Connection Details:");
console.log("  URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"));
console.log("  SSL:", config.ssl ? "Enabled" : "Disabled");
console.log("  Timeout:", config.connectionTimeoutMillis + "ms\n");

const pool = new Pool(config);

async function testConnection() {
  const startTime = Date.now();

  try {
    console.log("⏳ Attempting to connect...");
    const client = await pool.connect();
    const duration = Date.now() - startTime;

    console.log(`✅ Connected successfully in ${duration}ms\n`);

    console.log("🧪 Testing query...");
    const result = await client.query("SELECT NOW() as current_time, version() as db_version");
    console.log("✅ Query successful:");
    console.log("  Time:", result.rows[0].current_time);
    console.log("  Version:", result.rows[0].db_version.split(" ").slice(0, 3).join(" "));

    client.release();

    console.log("\n🎉 Database connection is working perfectly!");
    process.exit(0);
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`\n❌ Connection failed after ${duration}ms\n`);
    console.error("Error Details:");
    console.error("  Code:", error.code || "UNKNOWN");
    console.error("  Message:", error.message);

    console.log("\n🔧 Troubleshooting Steps:");
    console.log("  1. Check if your Supabase project is active (not paused)");
    console.log("     → Visit: https://app.supabase.com/project/mwszsyyxewxejwhaqtpe");
    console.log("  2. Verify your network allows port 6543 connections");
    console.log("     → Try from a different network (mobile hotspot, VPN)");
    console.log("  3. Get the correct connection string from Supabase dashboard");
    console.log("     → Go to: Project Settings → Database → Connection string");
    console.log("  4. Consider using Supabase's REST API instead of direct database connection");

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error("\n⏱️  Connection attempt timed out after 15 seconds");
  console.log("\n🔧 This suggests a network/firewall issue:");
  console.log("  → Port 6543 might be blocked by your network");
  console.log("  → Try using a VPN or different network");
  console.log("  → Contact your network administrator");
  process.exit(1);
}, 15000);

testConnection().finally(() => clearTimeout(timeout));
