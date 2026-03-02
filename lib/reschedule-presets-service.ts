import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface ReschedulePreset {
  id: number;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePresetInput {
  message: string;
}

export interface UpdatePresetInput {
  message?: string;
  is_active?: boolean;
}

export async function getAllPresets(activeOnly = false): Promise<ReschedulePreset[]> {
  const supabase = createAdminSupabaseClient();
  
  let query = supabase
    .from("reschedule_presets")
    .select("*")
    .order("created_at", { ascending: true });
  
  if (activeOnly) {
    query = query.eq("is_active", true);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching reschedule presets:", error);
    throw new Error("Failed to fetch presets");
  }
  
  return data || [];
}

export async function getPresetById(id: number): Promise<ReschedulePreset | null> {
  const supabase = createAdminSupabaseClient();
  
  const { data, error } = await supabase
    .from("reschedule_presets")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

export async function createPreset(input: CreatePresetInput): Promise<ReschedulePreset> {
  const supabase = createAdminSupabaseClient();
  
  const { data, error } = await supabase
    .from("reschedule_presets")
    .insert({ message: input.message })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating reschedule preset:", error);
    throw new Error("Failed to create preset");
  }
  
  return data;
}

export async function updatePreset(id: number, input: UpdatePresetInput): Promise<ReschedulePreset> {
  const supabase = createAdminSupabaseClient();
  
  const { data, error } = await supabase
    .from("reschedule_presets")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating reschedule preset:", error);
    throw new Error("Failed to update preset");
  }
  
  return data;
}

export async function deletePreset(id: number): Promise<void> {
  const supabase = createAdminSupabaseClient();
  
  const { error } = await supabase
    .from("reschedule_presets")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting reschedule preset:", error);
    throw new Error("Failed to delete preset");
  }
}

export async function togglePresetActive(id: number, isActive: boolean): Promise<ReschedulePreset> {
  return updatePreset(id, { is_active: isActive });
}
