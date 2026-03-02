import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withAuth } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req, session) => {
      try {
        const clientId = parseInt(params.id);
        
        const supabase = createAdminSupabaseClient();
        
        const { data: client, error: fetchError } = await supabase
          .from("clients")
          .select("id, x_number, name, phone")
          .eq("id", clientId)
          .single();

        if (fetchError || !client) {
          return NextResponse.json(
            { error: "Client not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Client uses unified session-based authentication",
        });
      } catch (error: any) {
        console.error("Error:", error);
        return NextResponse.json(
          { error: error.message || "Failed" },
          { status: 500 }
        );
      }
    },
    { requireStaff: true }
  )(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req, session) => {
      try {
        const clientId = parseInt(params.id);
        
        const supabase = createAdminSupabaseClient();
        
        const { data: client, error: fetchError } = await supabase
          .from("clients")
          .select("name")
          .eq("id", clientId)
          .single();

        if (fetchError || !client) {
          return NextResponse.json(
            { error: "Client not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Client uses unified session-based authentication",
        });
      } catch (error: any) {
        console.error("Error:", error);
        return NextResponse.json(
          { error: error.message || "Failed" },
          { status: 500 }
        );
      }
    },
    { requireStaff: true }
  )(request);
}
