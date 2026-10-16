"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { QrScanner } from "./QrScanner";
import { RecentActivity } from "./RecentActivity";
import { ScanResultSheet, type ScanResult } from "./ScanResultSheet";
import { Page, PageHeader } from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  findVehicle,
  getRecentLogs,
  getVehicleStatus,
} from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/utils";
import type { AccessLogWithVehicle } from "@/types/database";

export function ScannerView() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState("");
  const [recent, setRecent] = useState<AccessLogWithVehicle[]>([]);
  const [recentLoading, setRecentLoading] = useState(isSupabaseConfigured);
  const busy = useRef(false);

  const loadRecent = useCallback(() => {
    if (!isSupabaseConfigured()) return Promise.resolve();
    return getRecentLogs(6)
      .then(setRecent)
      .catch(() => {
        /* la lista reciente es secundaria; no bloquea el escáner */
      })
      .finally(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  const lookup = useCallback(async (raw: string) => {
    const term = raw.trim();
    if (!term || busy.current) return;
    busy.current = true;
    navigator.vibrate?.(25);
    setResult({ kind: "loading" });
    try {
      const vehicle = await findVehicle(term);
      if (!vehicle) {
        setResult({ kind: "not_found", term });
        return;
      }
      const status = await getVehicleStatus(vehicle.id);
      setResult({ kind: "found", vehicle, status });
    } catch (err) {
      setResult({ kind: "error", message: errorMessage(err) });
    }
  }, []);

  const closeSheet = useCallback(() => {
    setResult(null);
    window.setTimeout(() => {
      busy.current = false;
    }, 600);
  }, []);

  return (
    <Page>
      <PageHeader
        eyebrow="Control de acceso"
        title="Escanear"
        subtitle="Apunta la cámara al código QR del vehículo."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
        <div className="space-y-4">
          <QrScanner
            paused={result !== null}
            onScan={lookup}
            className="lg:max-w-[560px]"
          />

          <Card className="lg:max-w-[560px]">
            <form
              className="flex gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                void lookup(manual);
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder="Placa o código"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl bg-soft pr-4 pl-12 text-lg font-semibold uppercase outline-none placeholder:font-medium placeholder:normal-case placeholder:text-muted/70 focus:bg-white focus:ring-4 focus:ring-accent/20"
                />
              </div>
              <Button type="submit" size="lg" className="px-5" disabled={!manual.trim()}>
                Buscar
              </Button>
            </form>
          </Card>
        </div>

        <section>
          <h2 className="mb-4 text-xl font-bold tracking-tight lg:text-2xl">
            Últimos movimientos
          </h2>
          <RecentActivity logs={recent} loading={recentLoading} />
        </section>
      </div>

      <ScanResultSheet
        result={result}
        onClose={closeSheet}
        onRegistered={() => {
          setManual("");
          void loadRecent();
        }}
      />
    </Page>
  );
}
