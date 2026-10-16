"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, UserPlus, Users } from "lucide-react";
import { AffiliateWizard } from "./AffiliateWizard";
import { AffiliateDetailSheet } from "./AffiliateDetailSheet";
import { Page, PageHeader, EmptyState, ErrorBanner } from "@/components/ui/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { listAffiliates } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { OWNER_TYPE_LABEL, errorMessage, ownerDisplayName } from "@/lib/utils";
import type { OwnerWithVehicles } from "@/types/database";

export function AffiliatesView() {
  const [owners, setOwners] = useState<OwnerWithVehicles[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selected, setSelected] = useState<OwnerWithVehicles | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    if (!isSupabaseConfigured()) return Promise.resolve();
    return listAffiliates()
      .then((data) => {
        setOwners(data);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return owners;
    return owners.filter((o) =>
      [o.primary_name, o.secondary_name ?? "", ...o.vehicles.map((v) => v.plate)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [owners, query]);

  const openWizard = () => setWizardOpen(true);

  return (
    <Page className="pb-24 lg:pb-0">
      <PageHeader
        eyebrow="Registro"
        title="Afiliados"
        subtitle={
          loading ? "Cargando…" : `${owners.length} registrados`
        }
        action={
          <Button size="md" className="hidden lg:inline-flex" onClick={openWizard}>
            <UserPlus className="size-5" />
            Nuevo afiliado
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="relative mb-5 md:max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nombre o placa"
          className="h-14 w-full rounded-2xl bg-white pr-4 pl-12 text-base font-medium outline-none placeholder:text-muted/70 focus:ring-4 focus:ring-accent/20"
        />
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-[1.75rem] bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title={query ? "Sin resultados" : "Aún no hay afiliados"}
          description={
            query
              ? "Prueba con otro nombre o placa."
              : "Registra al primer servidor o pareja de tíos con sus vehículos."
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((owner) => (
              <motion.li
                key={owner.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelected(owner);
                    setDetailOpen(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-4 rounded-[1.75rem] bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-md outline-none focus-visible:ring-4 focus-visible:ring-accent/30"
                >
                  <Avatar src={owner.photo_url} name={owner.primary_name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold tracking-tight">
                      {ownerDisplayName(owner)}
                    </p>
                    <p className="text-sm text-muted">{OWNER_TYPE_LABEL[owner.type]}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {owner.vehicles.map((v) => (
                        <span
                          key={v.id}
                          className="rounded-lg bg-soft px-2 py-0.5 font-mono text-xs font-bold tracking-wider"
                        >
                          {v.plate}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-[calc(var(--safe-bottom)+6.25rem)] z-30 flex justify-center px-5 lg:hidden">
        <Button size="lg" className="w-full max-w-md shadow-xl" onClick={openWizard}>
          <UserPlus className="size-5" />
          Nuevo afiliado
        </Button>
      </div>

      <AffiliateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={(owner) => setOwners((prev) => [owner, ...prev])}
      />

      <AffiliateDetailSheet
        owner={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={(owner) => {
          setSelected(owner);
          setOwners((prev) => prev.map((o) => (o.id === owner.id ? owner : o)));
        }}
        onDeleted={(id) => setOwners((prev) => prev.filter((o) => o.id !== id))}
      />
    </Page>
  );
}
