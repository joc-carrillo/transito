"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CarFront, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Input";

export interface VehicleDraft {
  key: string;
  plate: string;
  model_color: string;
}

export function VehicleFields({
  vehicles,
  onChange,
  onAdd,
}: {
  vehicles: VehicleDraft[];
  onChange: (vehicles: VehicleDraft[]) => void;
  onAdd: () => void;
}) {
  const update = (key: string, patch: Partial<VehicleDraft>) =>
    onChange(vehicles.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {vehicles.map((v, index) => (
          <motion.div
            key={v.key}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="rounded-[1.75rem] border border-line p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-base font-bold">
                <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <CarFront className="size-4" />
                </span>
                Vehículo {index + 1}
              </p>
              {vehicles.length > 1 && (
                <button
                  type="button"
                  aria-label={`Quitar vehículo ${index + 1}`}
                  onClick={() => onChange(vehicles.filter((x) => x.key !== v.key))}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-exit-soft hover:text-exit"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Placa"
                value={v.plate}
                autoCapitalize="characters"
                autoComplete="off"
                className="font-mono uppercase tracking-wider"
                onChange={(e) => update(v.key, { plate: e.target.value })}
              />
              <Input
                placeholder="Modelo y color"
                value={v.model_color}
                onChange={(e) => update(v.key, { model_color: e.target.value })}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button
        layout
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onAdd}
        className="flex h-16 w-full cursor-pointer items-center justify-center gap-2 rounded-[1.75rem] border-2 border-dashed border-line text-base font-semibold text-muted transition hover:border-ink/30 hover:text-ink"
      >
        <Plus className="size-5" />
        Agregar otro vehículo
      </motion.button>
    </div>
  );
}
