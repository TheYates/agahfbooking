/**
 * Set passwords for staff users
 * Run with: npx tsx scripts/set-staff-passwords.ts
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setPasswords() {
  console.log("🔐 Setting staff passwords...\n");

  try {
    // Hash passwords (10 rounds is secure and fast)
    const adminPassword = await bcrypt.hash("admin123", 10);
    const receptionistPassword = await bcrypt.hash("reception123", 10);

    // Get all staff users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, employee_id, role");

    if (usersError) throw usersError;

    console.log(`Found ${users?.length || 0} staff users\n`);

    // Update passwords based on role
    for (const user of users || []) {
      const password = user.role === "admin" ? adminPassword : receptionistPassword;
      const plainPassword = user.role === "admin" ? "admin123" : "reception123";

      const { error: updateError } = await supabase
        .from("users")
        .update({ password_hash: password })
        .eq("id", user.id);

      if (updateError) {
        console.error(`❌ Error updating ${user.name}:`, updateError.message);
      } else {
        console.log(`✅ ${user.name} (${user.employee_id})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password: ${plainPassword}\n`);
      }
    }

    console.log("\n🎉 Passwords set successfully!\n");
    console.log("📝 Login Credentials:\n");
    console.log("Admin Users:");
    console.log("  Employee ID: ADMIN001");
    console.log("  Password: admin123\n");
    console.log("Receptionist Users:");
    console.log("  Employee ID: REC001 or REC002");
    console.log("  Password: reception123\n");
    console.log("⚠️  IMPORTANT: Change these passwords in production!");

  } catch (error) {
    console.error("\n❌ Error setting passwords:", error);
    throw error;
  }
}

setPasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
