import { nanoid } from "nanoid";
import { getSupabase } from "./client";
import type { Profile, TablesInsert } from "@/types/database";

export const AVATARS_BUCKET = "avatars";

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface ProfileFields {
  first_name: string;
  last_name: string;
  cedula: string;
  phone: string;
}

export async function saveMyProfile(
  userId: string,
  patch: Partial<ProfileFields> & { photo_url?: string | null },
): Promise<Profile> {
  const row: TablesInsert<"profiles"> = { id: userId };
  if (patch.first_name !== undefined) row.first_name = patch.first_name.trim();
  if (patch.last_name !== undefined) row.last_name = patch.last_name.trim();
  if (patch.phone !== undefined) row.phone = patch.phone.trim();
  if (patch.cedula !== undefined) row.cedula = patch.cedula.trim() || null;
  if (patch.photo_url !== undefined) row.photo_url = patch.photo_url;

  const { data, error } = await getSupabase()
    .from("profiles")
    .upsert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function isCedulaAvailable(cedula: string, excludeUserId?: string) {
  const { data, error } = await getSupabase().rpc("cedula_disponible", {
    p_cedula: cedula.trim(),
    ...(excludeUserId ? { p_exclude: excludeUserId } : {}),
  });
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId: string, file: Blob): Promise<string> {
  const storage = getSupabase().storage.from(AVATARS_BUCKET);
  const path = `${userId}/${nanoid()}.jpg`;
  const { error } = await storage.upload(path, file, {
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  return storage.getPublicUrl(path).data.publicUrl;
}

export async function deleteAvatar(url: string | null) {
  if (!url) return;
  const marker = `/object/public/${AVATARS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  await getSupabase()
    .storage.from(AVATARS_BUCKET)
    .remove([decodeURIComponent(url.slice(index + marker.length))]);
}

export function profileFullName(profile: Pick<Profile, "first_name" | "last_name"> | null) {
  return profile ? `${profile.first_name} ${profile.last_name}`.trim() : "";
}
