import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ClientAuthData {
  email: string;
  password: string;
  xNumber: string;
  name: string;
}

/**
 * Create a new Supabase Auth user for a client
 * This should be called when creating a new client in the database
 */
export async function createClientAuthUser({
  email,
  password,
  xNumber,
  name,
}: ClientAuthData) {
  const supabase = createAdminSupabaseClient();

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        x_number: xNumber,
        name: name,
        role: "client",
      },
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Failed to create auth user: No user returned");
    }

    return {
      success: true,
      userId: authData.user.id,
      email: authData.user.email,
    };
  } catch (error) {
    console.error("Error creating client auth user:", error);
    throw error;
  }
}

/**
 * Update client auth user details
 */
export async function updateClientAuthUser({
  authUserId,
  email,
  password,
  metadata,
}: {
  authUserId: string;
  email?: string;
  password?: string;
  metadata?: Record<string, any>;
}) {
  const supabase = createAdminSupabaseClient();

  try {
    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (metadata) updateData.user_metadata = metadata;

    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      authUserId,
      updateData
    );

    if (authError) {
      throw new Error(`Failed to update auth user: ${authError.message}`);
    }

    return {
      success: true,
      user: authData.user,
    };
  } catch (error) {
    console.error("Error updating client auth user:", error);
    throw error;
  }
}

/**
 * Delete client auth user
 */
export async function deleteClientAuthUser(authUserId: string) {
  const supabase = createAdminSupabaseClient();

  try {
    const { error } = await supabase.auth.admin.deleteUser(authUserId);

    if (error) {
      throw new Error(`Failed to delete auth user: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting client auth user:", error);
    throw error;
  }
}

/**
 * Generate a secure temporary password for new clients
 */
export function generateTempPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one of each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

/**
 * Get current authenticated user from session
 */
export async function getCurrentAuthUser() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentAuthUser();
  return !!user;
}

/**
 * Get client data linked to auth user
 */
export async function getClientByAuthId(authUserId: string) {
  const supabase = createAdminSupabaseClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) {
    console.error("Error fetching client by auth ID:", error);
    return null;
  }

  return client;
}

/**
 * Sign in client with email and password
 */
export async function signInClient(email: string, password: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
