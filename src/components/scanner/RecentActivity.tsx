"use client";

import { AnimatePresence, motion } from "framer-motion";
import { History, LogIn, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Page";
import { useTodayKey } from "@/lib/hooks";
import { RegistrarTag } from "@/components/ui/RegistrarTag";
import { cn, formatRelativeStamp, ownerDisplayName, staffName } from "@/lib/utils";
import type { AccessLogWithVehicle } from "@/types/database";

export function RecentActivity({
  logs,
  loading,
}: {
  logs: AccessLogWithVehicle[];
  loading: boolean;
}) {
  const todayKey = useTodayKey();

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[76px] animate-pulse rounded-3xl bg-white" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-6" />}
        title="Sin movimientos aún"
        description="Los registros de entrada y salida aparecerán aquí."
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      <AnimatePresence initial={false}>
        {logs.map((log) => {
          const entry = log.action === "entry";
          const owner = log.vehicle.owner;
          return (
            <motion.li
              key={log.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3.5 rounded-3xl bg-white p-3.5 pr-5"
            >
              <Avatar src={owner.photo_url} name={owner.primary_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-base font-bold tracking-wider">
                  {log.vehicle.plate}
                </p>
                <p className="truncate text-sm text-muted">
                  {ownerDisplayName(owner)}
                </p>
                <RegistrarTag
                  className="mt-1 max-w-full"
                  name={staffName(log.registrar)}
                  photoUrl={log.registrar?.photo_url ?? null}
                />
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                    entry ? "bg-entry-soft text-entry" : "bg-exit-soft text-exit",
                  )}
                >
                  {entry ? (
                    <LogIn className="size-3.5" />
                  ) : (
                    <LogOut className="size-3.5" />
                  )}
                  {entry ? "Entrada" : "Salida"}
                </span>
                <p className="mt-1 text-xs font-medium text-muted tabular-nums">
                  {formatRelativeStamp(log.timestamp, todayKey)}
                </p>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
