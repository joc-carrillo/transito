"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, LogIn, LogOut, QrCode, ScanLine } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { RegistrarTag } from "@/components/ui/RegistrarTag";
import { registerAccess } from "@/lib/supabase/queries";
import { useTodayKey } from "@/lib/hooks";
import {
  OWNER_TYPE_LABEL,
  cn,
  errorMessage,
  formatRelativeStamp,
  formatTime,
} from "@/lib/utils";
import type {
  AccessAction,
  AccessLog,
  VehicleStatus,
  VehicleWithOwner,
} from "@/types/database";

export type ScanResult =
  | { kind: "loading" }
  | { kind: "found"; vehicle: VehicleWithOwner; status: VehicleStatus | null }
  | { kind: "not_found"; term: string }
  | { kind: "error"; message: string };

export function ScanResultSheet({
  result,
  onClose,
  onRegistered,
}: {
  result: ScanResult | null;
  onClose: () => void;
  onRegistered: (log: AccessLog) => void;
}) {
  const [pending, setPending] = useState<AccessAction | null>(null);
  const [done, setDone] = useState<AccessLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (pending) return;
    setDone(null);
    setError(null);
    onClose();
  };

  const register = async (vehicleId: string, action: AccessAction) => {
    setPending(action);
    setError(null);
    try {
      const log = await registerAccess(vehicleId, action);
      navigator.vibrate?.(40);
      setDone(log);
      onRegistered(log);
      window.setTimeout(() => {
        setDone(null);
        onClose();
      }, 1400);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  };

  const found = result?.kind === "found" ? result : null;

  return (
    <BottomSheet
      open={result !== null}
      onClose={close}
      desktopWidth="md"
      footer={
        found && !done ? (
          <div className="grid gap-3">
            <Button
              variant="entry"
              size="xl"
              fullWidth
              loading={pending === "entry"}
              disabled={pending !== null}
              onClick={() => register(found.vehicle.id, "entry")}
            >
              <LogIn className="size-6" strokeWidth={2.4} />
              Registrar Entrada
            </Button>
            <Button
              variant="exit"
              size="xl"
              fullWidth
              loading={pending === "exit"}
              disabled={pending !== null}
              onClick={() => register(found.vehicle.id, "exit")}
            >
              <LogOut className="size-6" strokeWidth={2.4} />
              Registrar Salida
            </Button>
          </div>
        ) : result && result.kind !== "loading" && !done ? (
          <Button size="lg" fullWidth onClick={close}>
            <ScanLine className="size-5" />
            Escanear de nuevo
          </Button>
        ) : undefined
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <SuccessState key="done" log={done} />
        ) : result?.kind === "loading" ? (
          <motion.div
            key="loading"
            className="flex flex-col items-center gap-4 py-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="size-12 animate-spin rounded-full border-4 border-soft border-t-ink" />
            <p className="text-lg font-semibold text-muted">Buscando vehículo…</p>
          </motion.div>
        ) : found ? (
          <FoundState
            key={found.vehicle.id}
            vehicle={found.vehicle}
            status={found.status}
            error={error}
          />
        ) : result?.kind === "not_found" || result?.kind === "error" ? (
          <motion.div
            key="missing"
            className="flex flex-col items-center py-10 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-exit-soft text-exit">
              <QrCode className="size-9" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">
              {result.kind === "not_found"
                ? "Vehículo no registrado"
                : "No se pudo leer"}
            </h3>
            <p className="mt-2 max-w-xs text-base break-all text-muted">
              {result.kind === "not_found"
                ? `No hay ningún vehículo con el código o placa “${result.term}”.`
                : result.message}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </BottomSheet>
  );
}

function FoundState({
  vehicle,
  status,
  error,
}: {
  vehicle: VehicleWithOwner;
  status: VehicleStatus | null;
  error: string | null;
}) {
  const todayKey = useTodayKey();
  const owner = vehicle.owner;
  const inside = status?.is_inside ?? false;

  return (
    <motion.div
      className="flex flex-col items-center pt-2 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Avatar src={owner.photo_url} name={owner.primary_name} size="xl" />
      <span className="mt-4 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
        {OWNER_TYPE_LABEL[owner.type]}
      </span>
      <h3 className="mt-3 text-[1.75rem] leading-tight font-bold tracking-tight">
        {owner.primary_name}
      </h3>
      {owner.secondary_name && (
        <p className="text-xl font-semibold text-muted">
          y {owner.secondary_name}
        </p>
      )}

      <div className="mt-6 w-full rounded-3xl bg-soft p-5">
        <p className="font-mono text-4xl font-bold tracking-[0.12em]">
          {vehicle.plate}
        </p>
        {vehicle.model_color && (
          <p className="mt-1 text-base font-medium text-muted">
            {vehicle.model_color}
          </p>
        )}
      </div>

      <div
        className={cn(
          "mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
          !status?.last_timestamp
            ? "bg-soft text-muted"
            : inside
              ? "bg-entry-soft text-entry"
              : "bg-exit-soft text-exit",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full",
            !status?.last_timestamp ? "bg-muted" : inside ? "bg-entry" : "bg-exit",
          )}
        />
        {!status?.last_timestamp
          ? "Sin movimientos registrados"
          : `${inside ? "En el lugar" : "Fuera"} desde ${formatRelativeStamp(status.last_timestamp, todayKey)}`}
      </div>
      {status?.last_timestamp && (
        <RegistrarTag className="mt-2" name={status.last_registered_by_name} />
      )}

      {error && (
        <p className="mt-4 w-full rounded-2xl bg-exit-soft px-4 py-3 text-sm font-medium text-exit">
          {error}
        </p>
      )}
    </motion.div>
  );
}

function SuccessState({ log }: { log: AccessLog }) {
  const entry = log.action === "entry";
  return (
    <motion.div
      className="flex flex-col items-center py-12 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={cn(
          "flex size-24 items-center justify-center rounded-full text-white",
          entry ? "bg-entry" : "bg-ink",
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        <Check className="size-12" strokeWidth={3} />
      </motion.div>
      <h3 className="mt-6 text-3xl font-bold tracking-tight">
        {entry ? "Entrada registrada" : "Salida registrada"}
      </h3>
      <p className="mt-2 text-lg font-medium text-muted">
        {formatTime(log.timestamp)}
      </p>
    </motion.div>
  );
}
