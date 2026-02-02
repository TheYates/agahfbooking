/**
 * Clean up duplicate users in the database
 * Run with: npx tsx scripts/cleanup-duplicate-users.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  console.log("🧹 Cleaning up duplicate users...\n");

  try {
    // Get all users
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    console.log(`Found ${users?.length || 0} total users\n`);

    // Group by employee_id
    const grouped = new Map<string, any[]>();
    for (const user of users || []) {
      if (!grouped.has(user.employee_id)) {
        grouped.set(user.employee_id, []);
      }
      grouped.get(user.employee_id)!.push(user);
    }

    // Find duplicates
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;

    for (const [employeeId, userList] of grouped) {
      if (userList.length > 1) {
        duplicatesFound++;
        console.log(`⚠️  Found ${userList.length} users with employee_id: ${employeeId}`);
        
        // Keep the first one (oldest), delete the rest
        const [keep, ...remove] = userList;
        console.log(`   ✅ Keeping: ${keep.name} (ID: ${keep.id}, created: ${keep.created_at})`);
        
        for (const user of remove) {
          console.log(`   ❌ Deleting: ${user.name} (ID: ${user.id}, created: ${user.created_at})`);
          
          const { error: deleteError } = await supabase
            .from("users")
            .delete()
            .eq("id", user.id);

          if (deleteError) {
            console.error(`      Error deleting: ${deleteError.message}`);
          } else {
            duplicatesRemoved++;
          }
        }
        console.log();
      }
    }

    if (duplicatesFound === 0) {
      console.log("✅ No duplicates found!\n");
    } else {
      console.log(`\n✅ Cleanup complete!`);
      console.log(`   Duplicates found: ${duplicatesFound}`);
      console.log(`   Duplicates removed: ${duplicatesRemoved}\n`);
    }

    // Show final user list
    const { data: finalUsers } = await supabase
      .from("users")
      .select("id, name, employee_id, role, is_active")
      .order("employee_id");

    console.log("📋 Current users:");
    for (const user of finalUsers || []) {
      console.log(`   ${user.employee_id} - ${user.name} (${user.role}) ${user.is_active ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

cleanupDuplicates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
