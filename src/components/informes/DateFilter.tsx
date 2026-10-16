"use client";

import { CalendarDays } from "lucide-react";
import { addDays, cn, fromDateKey, toDateKey } from "@/lib/utils";

export interface DateRange {
  from: string;
  to: string;
}

const PRESETS = [
  { label: "Hoy", days: 0 },
  { label: "7 días", days: 6 },
  { label: "30 días", days: 29 },
] as const;

export function presetRange(todayKey: string, days: number): DateRange {
  return {
    from: toDateKey(addDays(fromDateKey(todayKey), -days)),
    to: todayKey,
  };
}

export function DateFilter({
  value,
  todayKey,
  onChange,
}: {
  value: DateRange;
  todayKey: string;
  onChange: (range: DateRange) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {PRESETS.map((p) => {
          const preset = presetRange(todayKey, p.days);
          const active = preset.from === value.from && preset.to === value.to;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(preset)}
              className={cn(
                "h-10 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-4 focus-visible:ring-accent/30",
                active ? "bg-ink text-white" : "bg-white text-ink hover:bg-line",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {(["from", "to"] as const).map((field) => (
          <label
            key={field}
            className="relative flex h-16 flex-col justify-center rounded-2xl bg-white px-4 focus-within:ring-4 focus-within:ring-accent/20"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <CalendarDays className="size-3.5" />
              {field === "from" ? "Desde" : "Hasta"}
            </span>
            <input
              type="date"
              value={value[field]}
              max={field === "from" ? value.to : todayKey}
              min={field === "to" ? value.from : undefined}
              onChange={(e) => {
                if (!e.target.value) return;
                onChange({ ...value, [field]: e.target.value });
              }}
              className="w-full cursor-pointer bg-transparent text-base font-semibold outline-none"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
