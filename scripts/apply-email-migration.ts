/**
 * Apply email column migration to clients table
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

async function applyMigration() {
  console.log("🔧 Applying email column migration...\n");

  const sql = `
    -- Add email column if it doesn't exist
    ALTER TABLE IF EXISTS public.clients
      ADD COLUMN IF NOT EXISTS email TEXT;

    -- Optional: enforce uniqueness when populated
    CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique
      ON public.clients (email)
      WHERE email IS NOT NULL;

    -- Helpful index for lookups
    CREATE INDEX IF NOT EXISTS clients_x_number_idx
      ON public.clients (x_number);
  `;

  try {
    // Execute the SQL using Supabase's RPC or direct query
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql }).single();
    
    if (error) {
      console.log("⚠️  RPC method not available, trying alternative...\n");
      
      // Alternative: Just inform user to run manually
      console.log("📋 Please run this SQL in Supabase SQL Editor:\n");
      console.log(sql);
      console.log("\nSteps:");
      console.log("1. Go to: https://supabase.com/dashboard/project/fzaxgisyvkblwafeoxib/editor");
      console.log("2. Click 'SQL Editor' in left sidebar");
      console.log("3. Click 'New query'");
      console.log("4. Copy-paste the SQL above");
      console.log("5. Click 'Run'\n");
      
      return;
    }

    console.log("✅ Migration applied successfully!\n");
    console.log("The clients table now has an 'email' column.");
    
  } catch (error) {
    console.error("❌ Error:", error);
    console.log("\n📋 Please run this SQL manually in Supabase SQL Editor:\n");
    console.log(sql);
  }
}

applyMigration();
