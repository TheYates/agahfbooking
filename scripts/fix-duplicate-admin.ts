/**
 * Fix duplicate ADMIN001 users
 * Option 1: Reassign appointments to first admin
 * Option 2: Change duplicate's employee_id
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

async function fixDuplicate() {
  console.log("🔧 Fixing duplicate ADMIN001 users...\n");

  try {
    // Get both ADMIN001 users
    const { data: admins, error } = await supabase
      .from("users")
      .select("*")
      .eq("employee_id", "ADMIN001")
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (admins.length !== 2) {
      console.log(`Found ${admins.length} ADMIN001 users. Expected 2.`);
      return;
    }

    const [keepUser, duplicateUser] = admins;

    console.log("Found users:");
    console.log(`  Keep: ${keepUser.name} (ID: ${keepUser.id})`);
    console.log(`  Duplicate: ${duplicateUser.name} (ID: ${duplicateUser.id})\n`);

    // Reassign all appointments from duplicate to keep
    console.log("Reassigning appointments...");
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .update({ booked_by: keepUser.id })
      .eq("booked_by", duplicateUser.id)
      .select();

    if (apptError) throw apptError;
    console.log(`  ✅ Reassigned ${appointments?.length || 0} appointments\n`);

    // Now delete the duplicate
    console.log("Deleting duplicate user...");
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", duplicateUser.id);

    if (deleteError) throw deleteError;
    console.log("  ✅ Deleted duplicate user\n");

    console.log("✅ Fix complete!\n");

    // Show final result
    const { data: finalAdmins } = await supabase
      .from("users")
      .select("*")
      .eq("employee_id", "ADMIN001");

    console.log(`Now ${finalAdmins?.length || 0} ADMIN001 user(s):`);
    for (const admin of finalAdmins || []) {
      console.log(`  ${admin.name} (ID: ${admin.id})`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

fixDuplicate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
