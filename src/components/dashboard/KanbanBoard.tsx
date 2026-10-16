"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { CarFront, ParkingSquare, RefreshCw, Search } from "lucide-react";
import { VehicleCard } from "./VehicleCard";
import { Page, PageHeader, EmptyState, ErrorBanner } from "@/components/ui/Page";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { Button } from "@/components/ui/Button";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { getVehicleStatuses } from "@/lib/supabase/queries";
import { useMediaQuery, useTodayKey } from "@/lib/hooks";
import { cn, errorMessage } from "@/lib/utils";
import type { VehicleStatus } from "@/types/database";

type Column = "inside" | "outside";

const COLUMN_META: Record<Column, { title: string; empty: string }> = {
  inside: {
    title: "Vehículos en Lugar",
    empty: "No hay vehículos dentro del complejo.",
  },
  outside: {
    title: "Vehículos Ausentes",
    empty: "Todos los vehículos están dentro.",
  },
};

export function KanbanBoard() {
  const [statuses, setStatuses] = useState<VehicleStatus[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Column>("inside");
  const [query, setQuery] = useState("");
  const todayKey = useTodayKey();
  const isTwoColumns = useMediaQuery("(min-width: 768px)");

  const load = useCallback(
    () =>
      getVehicleStatuses()
        .then((data) => {
          setStatuses(data);
          setError(null);
        })
        .catch((err) => setError(errorMessage(err)))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        }),
    [],
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void load();

    const supabase = getSupabase();
    const channel = supabase
      .channel("dashboard-access-logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "access_logs" },
        () => void load(),
      )
      .subscribe();

    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const columns = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? statuses.filter((s) =>
          [s.plate, s.primary_name, s.secondary_name ?? "", s.model_color]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : statuses;
    return {
      inside: filtered.filter((s) => s.is_inside),
      outside: filtered.filter((s) => !s.is_inside),
    };
  }, [statuses, query]);

  const renderList = (column: Column) => {
    const items = columns[column];
    if (loading) {
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-[1.75rem] bg-white" />
          ))}
        </div>
      );
    }
    return (
      <ul className="grid gap-3 lg:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((s) => (
            <VehicleCard key={s.vehicle_id} status={s} todayKey={todayKey} />
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <li className="lg:col-span-2">
            <EmptyState
              icon={
                column === "inside" ? (
                  <ParkingSquare className="size-6" />
                ) : (
                  <CarFront className="size-6" />
                )
              }
              title={query ? "Sin resultados" : "Nada por aquí"}
              description={query ? "Prueba con otra placa o nombre." : COLUMN_META[column].empty}
            />
          </li>
        )}
      </ul>
    );
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Estado del complejo"
        title="Dashboard"
        action={
          <Button
            variant="secondary"
            size="icon"
            aria-label="Actualizar"
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
          >
            <RefreshCw className={cn("size-5", refreshing && "animate-spin")} />
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="mb-5 grid grid-cols-2 gap-3 md:max-w-md">
        <div className="rounded-[1.75rem] bg-ink p-5 text-white">
          <p className="text-sm font-medium text-white/60">En lugar</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">
            {loading ? "–" : statuses.filter((s) => s.is_inside).length}
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-white p-5">
          <p className="text-sm font-medium text-muted">Ausentes</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">
            {loading ? "–" : statuses.filter((s) => !s.is_inside).length}
          </p>
        </div>
      </div>

      <div className="relative mb-5 md:max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar placa o nombre"
          className="h-14 w-full rounded-2xl bg-white pr-4 pl-12 text-base font-medium outline-none placeholder:text-muted/70 focus:ring-4 focus:ring-accent/20"
        />
      </div>

      <LayoutGroup>
        {isTwoColumns ? (
          <div className="grid grid-cols-2 gap-5 lg:gap-8">
            {(["inside", "outside"] as const).map((column) => (
              <section
                key={column}
                className="rounded-[2rem] bg-white/50 p-4 lg:p-5"
              >
                <header className="mb-4 flex items-center justify-between px-1">
                  <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight lg:text-xl">
                    <span
                      className={cn(
                        "size-2.5 rounded-full",
                        column === "inside" ? "bg-entry" : "bg-exit",
                      )}
                    />
                    {COLUMN_META[column].title}
                  </h2>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold tabular-nums">
                    {columns[column].length}
                  </span>
                </header>
                {renderList(column)}
              </section>
            ))}
          </div>
        ) : (
          <>
            <SegmentedTabs
              className="mb-4"
              value={tab}
              onChange={setTab}
              options={[
                { value: "inside", label: "En Lugar", count: columns.inside.length },
                { value: "outside", label: "Ausentes", count: columns.outside.length },
              ]}
            />
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              dragDirectionLock
              style={{ touchAction: "pan-y" }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 && tab === "inside") setTab("outside");
                if (info.offset.x > 70 && tab === "outside") setTab("inside");
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: tab === "inside" ? -24 : 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tab === "inside" ? 24 : -24 }}
                  transition={{ duration: 0.18 }}
                >
                  {renderList(tab)}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </LayoutGroup>
    </Page>
  );
}
