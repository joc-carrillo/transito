"use client";

import { useSyncExternalStore } from "react";
import { toDateKey } from "@/lib/utils";

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");

/** Clave yyyy-mm-dd del día actual; "" durante el prerender. */
export function useTodayKey() {
  return useSyncExternalStore(
    (onChange) => {
      const id = window.setInterval(onChange, 60_000);
      return () => window.clearInterval(id);
    },
    () => toDateKey(new Date()),
    () => "",
  );
}
