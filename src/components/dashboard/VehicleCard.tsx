"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RegistrarTag } from "@/components/ui/RegistrarTag";
import { cn, formatRelativeStamp, ownerDisplayName } from "@/lib/utils";
import type { VehicleStatus } from "@/types/database";

export function VehicleCard({
  status,
  todayKey,
}: {
  status: VehicleStatus;
  todayKey: string;
}) {
  return (
    <motion.li
      layout
      layoutId={status.vehicle_id}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className="flex items-center gap-4 rounded-[1.75rem] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
    >
      <Avatar
        src={status.photo_url}
        name={status.primary_name}
        size="md"
        className={cn(
          "ring-4",
          status.is_inside ? "ring-entry-soft" : "ring-soft",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xl font-bold tracking-wider">
          {status.plate}
        </p>
        <p className="truncate text-sm font-medium text-muted">
          {ownerDisplayName(status)}
        </p>
        {status.model_color && (
          <p className="truncate text-xs text-muted/80">{status.model_color}</p>
        )}
        {status.last_timestamp && (
          <RegistrarTag className="mt-1 max-w-full" name={status.last_registered_by_name} />
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            "size-2.5 rounded-full",
            status.is_inside
              ? "bg-entry"
              : status.last_timestamp
                ? "bg-exit"
                : "bg-line",
          )}
        />
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted tabular-nums">
          <Clock className="size-3.5" />
          {status.last_timestamp
            ? formatRelativeStamp(status.last_timestamp, todayKey)
            : "—"}
        </span>
      </div>
    </motion.li>
  );
}
