import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LoginAuditUserType = "staff" | "client";

interface LoginAuditInput {
  userType: LoginAuditUserType;
  userId?: number | null;
  identifier?: string | null;
  ipAddress: string;
  userAgent?: string | null;
  success: boolean;
  errorMessage?: string | null;
}

export async function logLoginAttempt(input: LoginAuditInput): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from("login_audit").insert({
      user_type: input.userType,
      user_id: input.userId ?? null,
      identifier: input.identifier ?? null,
      ip_address: input.ipAddress,
      user_agent: input.userAgent ?? null,
      success: input.success,
      error_message: input.errorMessage ?? null,
    });
  } catch (error) {
    console.error("Failed to log login attempt:", error);
  }
}
