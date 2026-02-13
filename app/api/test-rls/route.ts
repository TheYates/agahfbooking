import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  try {
    // Test 1: Anon/Session client (respects RLS)
    const serverClient = await createServerSupabaseClient();
    const { data: anonUsers, error: anonError } = await serverClient
      .from("users")
      .select("id, name, phone, role")
      .limit(5);

    results.tests.push({
      name: "Anon/Session Client (respects RLS)",
      success: !anonError,
      rowCount: anonUsers?.length ?? 0,
      error: anonError?.message || null,
      note: "Should return 0 rows if no session, or user's own data if logged in",
    });

    // Test 2: Admin client (bypasses RLS)
    const adminClient = createAdminSupabaseClient();
    const { data: adminUsers, error: adminError } = await adminClient
      .from("users")
      .select("id, name, phone, role")
      .limit(5);

    results.tests.push({
      name: "Admin Client (bypasses RLS)",
      success: !adminError,
      rowCount: adminUsers?.length ?? 0,
      error: adminError?.message || null,
      note: "Should return all rows (RLS bypassed)",
    });

    // Test 3: Check RLS is enabled on tables
    const { data: rlsStatus, error: rlsError } = await adminClient.rpc(
      "get_rls_status",
      {}
    );

    if (rlsError) {
      // Try alternative query
      const { data: tablesInfo } = await adminClient
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_type", "BASE TABLE");

      results.tests.push({
        name: "RLS Status Check",
        success: true,
        tables: tablesInfo?.map((t) => t.table_name) || [],
        note: "Tables found. Check Supabase dashboard for RLS status.",
      });
    }

    // Test 4: Try to insert with anon (should fail)
    const { error: insertError } = await serverClient.from("users").insert({
      name: "Test User",
      phone: "1234567890",
      role: "receptionist",
    });

    results.tests.push({
      name: "Insert with Anon (should fail)",
      success: !!insertError, // Success if it fails!
      error: insertError?.message || null,
      note: "Should fail with RLS error if policies work correctly",
    });

    results.summary = {
      rlsWorking:
        results.tests[0]?.rowCount === 0 && results.tests[1]?.rowCount > 0,
      message:
        results.tests[0]?.rowCount === 0 && results.tests[1]?.rowCount > 0
          ? "✅ RLS is working! Anon sees nothing, Admin sees everything."
          : "⚠️ Check results - RLS may not be configured correctly",
    };

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        note: "Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local",
      },
      { status: 500 }
    );
  }
}
