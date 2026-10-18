import "server-only";

import { hasPublicSupabaseConfig, publicSupabaseClient } from "@/infrastructure/data/local-client";

export async function getMediaByIds(ids: number[]) {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("media").select("id, storage_path, alt_text").in("id", ids);
  if (error) {
    throw new Error(`Failed to fetch media by ids: ${error.message}`, { cause: error });
  }
  return data ?? [];
}

// Original attachment ids are still used by migrated cover blocks and category presets.
export async function getMediaByWpIds(wpIds: number[]) {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  if (wpIds.length === 0) return [];
  const { data, error } = await supabase
    .from("media")
    .select("id, wp_id, storage_path, alt_text")
    .in("wp_id", wpIds);
  if (error) {
    throw new Error(`Failed to fetch media by wp_ids: ${error.message}`, { cause: error });
  }
  return data ?? [];
}
