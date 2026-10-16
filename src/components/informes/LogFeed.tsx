"use client";

import { motion } from "framer-motion";
import { LogIn, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RegistrarTag } from "@/components/ui/RegistrarTag";
import { cn, dayLabel, formatTime, ownerDisplayName, staffName } from "@/lib/utils";
import type { AccessLogWithVehicle } from "@/types/database";

export interface DayGroup {
  key: string;
  logs: AccessLogWithVehicle[];
}

function ActionBadge({ entry }: { entry: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        entry ? "bg-entry-soft text-entry" : "bg-exit-soft text-exit",
      )}
    >
      {entry ? <LogIn className="size-3.5" /> : <LogOut className="size-3.5" />}
      {entry ? "Entrada" : "Salida"}
    </span>
  );
}

function DayHeader({ group, todayKey }: { group: DayGroup; todayKey: string }) {
  const entries = group.logs.filter((l) => l.action === "entry").length;
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xl font-bold tracking-tight">
        {dayLabel(group.key, todayKey)}
      </h2>
      <p className="text-sm font-medium text-muted tabular-nums">
        {entries} entradas · {group.logs.length - entries} salidas
      </p>
    </div>
  );
}

export function LogFeed({
  groups,
  todayKey,
}: {
  groups: DayGroup[];
  todayKey: string;
}) {
  return (
    <div className="space-y-8">
      {groups.map((group, gi) => (
        <motion.section
          key={group.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(gi * 0.04, 0.3) }}
        >
          <div className="sticky top-0 z-10 -mx-5 bg-canvas px-5 py-3 md:-mx-8 md:px-8 lg:mx-0 lg:px-1">
            <DayHeader group={group} todayKey={todayKey} />
          </div>

          {/* Móvil y tablet: feed */}
          <ul className="divide-y divide-line/70 overflow-hidden rounded-[1.75rem] bg-white lg:hidden">
            {group.logs.map((log) => (
              <li key={log.id} className="flex items-center gap-3.5 px-4 py-3.5">
                <Avatar
                  src={log.vehicle.owner.photo_url}
                  name={log.vehicle.owner.primary_name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-base font-bold tracking-wider">
                    {log.vehicle.plate}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {ownerDisplayName(log.vehicle.owner)}
                  </p>
                  <RegistrarTag
                    className="mt-1 max-w-full"
                    name={staffName(log.registrar)}
                    photoUrl={log.registrar?.photo_url ?? null}
                  />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ActionBadge entry={log.action === "entry"} />
                  <span className="text-sm font-semibold tabular-nums">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla minimalista */}
          <div className="hidden overflow-hidden rounded-[1.75rem] bg-white lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-xs font-semibold tracking-wider text-muted uppercase">
                  <th className="w-28 px-6 py-4">Hora</th>
                  <th className="w-44 px-6 py-4">Placa</th>
                  <th className="px-6 py-4">Afiliado</th>
                  <th className="px-6 py-4">Vehículo</th>
                  <th className="px-6 py-4">Marcó</th>
                  <th className="w-36 px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {group.logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-canvas/60">
                    <td className="px-6 py-3.5 text-base font-semibold tabular-nums">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-base font-bold tracking-wider">
                      {log.vehicle.plate}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={log.vehicle.owner.photo_url}
                          name={log.vehicle.owner.primary_name}
                          size="sm"
                          className="size-8 text-xs"
                        />
                        <span className="font-medium">
                          {ownerDisplayName(log.vehicle.owner)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-muted">
                      {log.vehicle.model_color || "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      {log.registrar ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={log.registrar.photo_url}
                            name={staffName(log.registrar) ?? ""}
                            size="xs"
                          />
                          <span className="text-sm font-medium">{staffName(log.registrar)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <ActionBadge entry={log.action === "entry"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      ))}
    </div>
  );
}
