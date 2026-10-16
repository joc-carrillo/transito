import { nanoid } from "nanoid";
import { getSupabase, OWNER_PHOTOS_BUCKET } from "./client";
import { normalizePlate } from "@/lib/utils";
import type {
  AccessAction,
  AccessLog,
  AccessLogWithVehicle,
  Owner,
  OwnerType,
  Vehicle,
  OwnerWithVehicles,
  VehicleStatus,
  VehicleWithOwner,
} from "@/types/database";

const VEHICLE_WITH_OWNER = "*, owner:owners(*)";
const LOG_SELECT: string = `*, vehicle:vehicles(${VEHICLE_WITH_OWNER}), registrar:staff(*)`;

export async function getVehicleByQr(
  hash: string,
): Promise<VehicleWithOwner | null> {
  const { data, error } = await getSupabase()
    .from("vehicles")
    .select(VEHICLE_WITH_OWNER)
    .eq("qr_code_hash", hash.trim())
    .maybeSingle();
  if (error) throw error;
  return data as VehicleWithOwner | null;
}

/** Busca por hash del QR y, si no existe, por placa (entrada manual). */
export async function findVehicle(
  term: string,
): Promise<VehicleWithOwner | null> {
  const byQr = await getVehicleByQr(term);
  if (byQr) return byQr;

  const { data, error } = await getSupabase()
    .from("vehicles")
    .select(VEHICLE_WITH_OWNER)
    .eq("plate", normalizePlate(term))
    .maybeSingle();
  if (error) throw error;
  return data as VehicleWithOwner | null;
}

export async function getVehicleStatus(
  vehicleId: string,
): Promise<VehicleStatus | null> {
  const { data, error } = await getSupabase()
    .from("vehicle_status")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getVehicleStatuses(): Promise<VehicleStatus[]> {
  const { data, error } = await getSupabase()
    .from("vehicle_status")
    .select("*")
    .order("last_timestamp", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function registerAccess(
  vehicleId: string,
  action: AccessAction,
): Promise<AccessLog> {
  const { data, error } = await getSupabase()
    .from("access_logs")
    .insert({
      vehicle_id: vehicleId,
      action,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadOwnerPhoto(file: Blob): Promise<string> {
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const path = `${nanoid()}.${ext}`;
  const storage = getSupabase().storage.from(OWNER_PHOTOS_BUCKET);

  const { error } = await storage.upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  return storage.getPublicUrl(path).data.publicUrl;
}

export interface NewAffiliate {
  type: OwnerType;
  primary_name: string;
  secondary_name: string | null;
  photo_url: string | null;
  vehicles: { plate: string; model_color: string }[];
}

export async function createAffiliate(
  input: NewAffiliate,
): Promise<OwnerWithVehicles> {
  const supabase = getSupabase();

  const { data: owner, error: ownerError } = await supabase
    .from("owners")
    .insert({
      type: input.type,
      primary_name: input.primary_name.trim(),
      secondary_name:
        input.type === "pareja_tios"
          ? input.secondary_name?.trim() || null
          : null,
      photo_url: input.photo_url,
    })
    .select()
    .single();
  if (ownerError) throw ownerError;

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .insert(
      input.vehicles.map((v) => ({
        owner_id: owner.id,
        plate: normalizePlate(v.plate),
        model_color: v.model_color.trim(),
        qr_code_hash: nanoid(16),
      })),
    )
    .select();

  if (vehiclesError) {
    await supabase.from("owners").delete().eq("id", owner.id);
    throw vehiclesError;
  }

  return { ...owner, vehicles: vehicles ?? [] };
}

function photoPathFromUrl(url: string) {
  const marker = `/object/public/${OWNER_PHOTOS_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

export async function deleteOwnerPhoto(url: string | null) {
  const path = url ? photoPathFromUrl(url) : null;
  if (!path) return;
  await getSupabase().storage.from(OWNER_PHOTOS_BUCKET).remove([path]);
}

export async function updateOwner(
  id: string,
  patch: {
    type: OwnerType;
    primary_name: string;
    secondary_name: string | null;
    photo_url: string | null;
  },
): Promise<Owner> {
  const { data, error } = await getSupabase()
    .from("owners")
    .update({
      type: patch.type,
      primary_name: patch.primary_name.trim(),
      secondary_name:
        patch.type === "pareja_tios" ? patch.secondary_name?.trim() || null : null,
      photo_url: patch.photo_url,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Borra el afiliado; sus vehículos y su historial se eliminan en cascada. */
export async function deleteOwner(owner: Owner) {
  const { error } = await getSupabase().from("owners").delete().eq("id", owner.id);
  if (error) throw error;
  await deleteOwnerPhoto(owner.photo_url).catch(() => {});
}

export async function addVehicle(
  ownerId: string,
  vehicle: { plate: string; model_color: string },
): Promise<Vehicle> {
  const { data, error } = await getSupabase()
    .from("vehicles")
    .insert({
      owner_id: ownerId,
      plate: normalizePlate(vehicle.plate),
      model_color: vehicle.model_color.trim(),
      qr_code_hash: nanoid(16),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateVehicle(
  id: string,
  patch: { plate: string; model_color: string },
): Promise<Vehicle> {
  const { data, error } = await getSupabase()
    .from("vehicles")
    .update({
      plate: normalizePlate(patch.plate),
      model_color: patch.model_color.trim(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Borra el vehículo y su historial de accesos (cascada). */
export async function deleteVehicle(id: string) {
  const { error } = await getSupabase().from("vehicles").delete().eq("id", id);
  if (error) throw error;
}

export async function listAffiliates(): Promise<OwnerWithVehicles[]> {
  const { data, error } = await getSupabase()
    .from("owners")
    .select("*, vehicles(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerWithVehicles[];
}

export async function getLogsByRange(
  from: Date,
  to: Date,
): Promise<AccessLogWithVehicle[]> {
  const { data, error } = await getSupabase()
    .from("access_logs")
    .select(LOG_SELECT)
    .gte("timestamp", from.toISOString())
    .lt("timestamp", to.toISOString())
    .order("timestamp", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as unknown as AccessLogWithVehicle[];
}

export async function getRecentLogs(
  limit = 8,
): Promise<AccessLogWithVehicle[]> {
  const { data, error } = await getSupabase()
    .from("access_logs")
    .select(LOG_SELECT)
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as AccessLogWithVehicle[];
}