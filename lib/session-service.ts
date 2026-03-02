import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { randomUUID } from "node:crypto";

export interface SessionData {
  id: string;
  userId: number;
  userType: "client" | "staff";
  role: "client" | "admin" | "receptionist" | "reviewer";
  xNumber?: string;
  employeeId?: string;
  name: string;
  phone?: string;
  category?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateSessionParams {
  userId: number;
  userType: "client" | "staff";
  role: "client" | "admin" | "receptionist" | "reviewer";
  xNumber?: string;
  employeeId?: string;
  name: string;
  phone?: string;
  category?: string;
  ipAddress?: string;
  userAgent?: string;
}

const SESSION_DURATION_HOURS = 24;

export async function createSession(params: CreateSessionParams): Promise<SessionData> {
  const supabase = createAdminSupabaseClient();
  const sessionId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const { error } = await supabase.from("sessions").insert({
    id: sessionId,
    user_id: params.userId,
    user_type: params.userType,
    role: params.role,
    x_number: params.xNumber || null,
    employee_id: params.employeeId || null,
    name: params.name,
    phone: params.phone || null,
    category: params.category || null,
    ip_address: params.ipAddress || null,
    user_agent: params.userAgent || null,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    is_revoked: false,
  });

  if (error) {
    console.error("Failed to create session:", error);
    throw new Error("Failed to create session");
  }

  return {
    id: sessionId,
    userId: params.userId,
    userType: params.userType,
    role: params.role,
    xNumber: params.xNumber,
    employeeId: params.employeeId,
    name: params.name,
    phone: params.phone,
    category: params.category,
    createdAt: now,
    expiresAt,
  };
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("is_revoked", false)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    userType: data.user_type,
    role: data.role,
    xNumber: data.x_number || undefined,
    employeeId: data.employee_id || undefined,
    name: data.name,
    phone: data.phone || undefined,
    category: data.category || undefined,
    createdAt: new Date(data.created_at),
    expiresAt: new Date(data.expires_at),
  };
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("sessions")
    .update({ is_revoked: true })
    .eq("id", sessionId);

  return !error;
}

export async function revokeAllUserSessions(userId: number, userType: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("sessions")
    .update({ is_revoked: true })
    .eq("user_id", userId)
    .eq("user_type", userType);

  return !error;
}

export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("sessions")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    console.error("Failed to cleanup sessions:", error);
    return 0;
  }

  return data?.length || 0;
}

export async function extendSession(sessionId: string): Promise<SessionData | null> {
  const supabase = createAdminSupabaseClient();
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("sessions")
    .update({ expires_at: newExpiresAt.toISOString() })
    .eq("id", sessionId)
    .eq("is_revoked", false)
    .gte("expires_at", new Date().toISOString())
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    userType: data.user_type,
    role: data.role,
    xNumber: data.x_number || undefined,
    employeeId: data.employee_id || undefined,
    name: data.name,
    phone: data.phone || undefined,
    category: data.category || undefined,
    createdAt: new Date(data.created_at),
    expiresAt: new Date(data.expires_at),
  };
}
