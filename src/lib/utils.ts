import { clsx, type ClassValue } from "clsx";
import type { OwnerType } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function normalizePlate(plate: string) {
  return plate.trim().toUpperCase().replace(/\s+/g, "");
}

export function ownerDisplayName(owner: {
  primary_name: string;
  secondary_name: string | null;
}) {
  return owner.secondary_name
    ? `${owner.primary_name} y ${owner.secondary_name}`
    : owner.primary_name;
}

export function staffName(
  staff: { first_name: string; last_name: string } | null | undefined,
) {
  return staff ? `${staff.first_name} ${staff.last_name}`.trim() || "Sin nombre" : null;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export const OWNER_TYPE_LABEL: Record<OwnerType, string> = {
  servidor: "Servidor",
  pareja_tios: "Pareja de tíos",
};

const timeFormatter = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
});

const longDateFormatter = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const shortDateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
});

export function formatTime(iso: string) {
  return timeFormatter.format(new Date(iso));
}

/** Clave local yyyy-mm-dd, útil para agrupar y para <input type="date">. */
export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function dayLabel(key: string, todayKey: string) {
  if (key === todayKey) return "Hoy";
  if (key === toDateKey(addDays(fromDateKey(todayKey), -1))) return "Ayer";
  const label = longDateFormatter.format(fromDateKey(key));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "14:32" si es de hoy, "3 oct · 14:32" si es de otro día. */
export function formatRelativeStamp(iso: string, todayKey: string) {
  const date = new Date(iso);
  const time = timeFormatter.format(date);
  return toDateKey(date) === todayKey
    ? time
    : `${shortDateFormatter.format(date)} · ${time}`;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Ocurrió un error inesperado";
}
