import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    console.log("Testing Supabase connection...");
    
    const supabase = await createServerSupabaseClient();
    
    // Test a simple query
    const { data, error } = await supabase
      .from("clients")
      .select("count")
      .limit(1);
    
    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { 
          error: "Supabase query failed", 
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      data: data,
    });
  } catch (error: any) {
    console.error("Test error:", error);
    return NextResponse.json(
      { 
        error: "Connection test failed", 
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
