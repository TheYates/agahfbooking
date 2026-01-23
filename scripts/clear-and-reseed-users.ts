/**
 * Clear existing users and re-seed with hashed passwords
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://lovable-manatee-131.convex.cloud";
const PASSWORD = "password123";

async function clearAndReseed() {
  console.log("🧹 Clearing and re-seeding users with hashed passwords...\n");
  
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // 1. Get all existing users
    console.log("📋 Fetching existing users...");
    const existingUsers = await client.query(api.queries.getUsers, {});
    console.log(`   Found ${existingUsers?.length || 0} users\n`);

    // 2. Delete existing users
    if (existingUsers && existingUsers.length > 0) {
      console.log("🗑️  Deleting old users...");
      for (const user of existingUsers) {
        try {
          await client.mutation(api.mutations.deleteUser, { id: user._id });
          console.log(`   ✅ Deleted ${user.name}`);
        } catch (error: any) {
          console.log(`   ⚠️  Could not delete ${user.name}: ${error.message}`);
        }
      }
      console.log("");
    }

    // 3. Hash password
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    console.log(`   ✅ Hash created: ${hashedPassword.substring(0, 20)}...\n`);

    // 4. Create new users with hashed passwords
    console.log("👥 Creating users with hashed passwords...");
    
    const users = [
      {
        name: "Admin User",
        phone: "+233244000001",
        role: "admin" as const,
        employee_id: "ADMIN001",
      },
      {
        name: "Jane Smith",
        phone: "+233244000002",
        role: "receptionist" as const,
        employee_id: "RECEP001",
      },
      {
        name: "Mary Johnson",
        phone: "+233244000003",
        role: "receptionist" as const,
        employee_id: "RECEP002",
      },
    ];

    for (const user of users) {
      try {
        await client.mutation(api.mutations.createUser, {
          ...user,
          password_hash: hashedPassword,
        });
        console.log(`   ✅ Created ${user.name} (${user.employee_id})`);
      } catch (error: any) {
        console.log(`   ❌ Failed to create ${user.name}: ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Users re-seeded successfully!");
    console.log("=".repeat(60));
    console.log("\n🔑 Login Credentials:");
    console.log("   Employee ID: ADMIN001");
    console.log("   Password: password123");
    console.log("\n   Employee ID: RECEP001");
    console.log("   Password: password123");
    console.log("\n✅ Passwords are now properly hashed with bcrypt!");

  } catch (error: any) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

clearAndReseed().catch(console.error);
