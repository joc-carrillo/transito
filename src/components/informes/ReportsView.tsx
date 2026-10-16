"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { DateFilter, presetRange, type DateRange } from "./DateFilter";
import { LogFeed, type DayGroup } from "./LogFeed";
import { Page, PageHeader, EmptyState, ErrorBanner } from "@/components/ui/Page";
import { getLogsByRange } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useTodayKey } from "@/lib/hooks";
import { addDays, errorMessage, fromDateKey, toDateKey } from "@/lib/utils";
import type { AccessLogWithVehicle } from "@/types/database";

interface FetchState {
  rangeKey: string;
  logs: AccessLogWithVehicle[];
  error: string | null;
}

export function ReportsView() {
  const todayKey = useTodayKey();
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [result, setResult] = useState<FetchState | null>(null);

  const range = customRange ?? (todayKey ? presetRange(todayKey, 6) : null);
  const rangeKey = range ? `${range.from}|${range.to}` : "";

  useEffect(() => {
    if (!range || !isSupabaseConfigured()) return;
    let cancelled = false;
    const from = fromDateKey(range.from);
    const to = addDays(fromDateKey(range.to), 1);

    getLogsByRange(from, to)
      .then((logs) => {
        if (!cancelled) setResult({ rangeKey, logs, error: null });
      })
      .catch((err) => {
        if (!cancelled) setResult({ rangeKey, logs: [], error: errorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rangeKey resume `range`
  }, [rangeKey]);

  const loading =
    isSupabaseConfigured() && (!result || result.rangeKey !== rangeKey);
  const logs = useMemo(
    () => (result && result.rangeKey === rangeKey ? result.logs : []),
    [result, rangeKey],
  );

  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, AccessLogWithVehicle[]>();
    for (const log of logs) {
      const key = toDateKey(new Date(log.timestamp));
      const list = map.get(key);
      if (list) list.push(log);
      else map.set(key, [log]);
    }
    return Array.from(map, ([key, logs]) => ({ key, logs }));
  }, [logs]);

  const entries = logs.filter((l) => l.action === "entry").length;

  return (
    <Page>
      <PageHeader eyebrow="Historial" title="Informes" />

      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="mb-6 space-y-3 lg:sticky lg:top-8 lg:mb-0">
          {range ? (
            <DateFilter value={range} todayKey={todayKey} onChange={setCustomRange} />
          ) : (
            <div className="h-[132px] animate-pulse rounded-3xl bg-white/60" />
          )}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Total", value: logs.length, tone: "bg-ink text-white" },
              { label: "Entradas", value: entries, tone: "bg-entry-soft text-entry" },
              { label: "Salidas", value: logs.length - entries, tone: "bg-exit-soft text-exit" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-3xl p-4 ${stat.tone}`}>
                <p className="text-xs font-semibold opacity-70">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {loading ? "–" : stat.value}
                </p>
              </div>
            ))}
          </div>
        </aside>

        <div>
          {result?.error && result.rangeKey === rangeKey && (
            <ErrorBanner message={result.error} />
          )}
          {loading ? (
            <div className="space-y-3">
              <div className="h-7 w-32 animate-pulse rounded-full bg-white" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[68px] animate-pulse rounded-3xl bg-white" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-6" />}
              title="Sin movimientos"
              description="No hay entradas ni salidas en el rango seleccionado."
            />
          ) : (
            <LogFeed groups={groups} todayKey={todayKey} />
          )}
        </div>
      </div>
    </Page>
  );
}
