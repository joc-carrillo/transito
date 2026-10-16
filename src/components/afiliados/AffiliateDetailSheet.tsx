"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CarFront, Pencil, Plus, Trash2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OwnerTypeSelector } from "./OwnerTypeSelector";
import { PhotoPicker, type PickedPhoto } from "./PhotoPicker";
import { QrPreview } from "./QrPreview";
import { friendlyError } from "./AffiliateWizard";
import {
  addVehicle,
  deleteOwner,
  deleteOwnerPhoto,
  deleteVehicle,
  updateOwner,
  updateVehicle,
  uploadOwnerPhoto,
} from "@/lib/supabase/queries";
import { compressImage } from "@/lib/image";
import { OWNER_TYPE_LABEL, ownerDisplayName } from "@/lib/utils";
import type { OwnerType, OwnerWithVehicles, Vehicle } from "@/types/database";

type Mode =
  | { kind: "view" }
  | { kind: "edit_owner" }
  | { kind: "vehicle_form"; vehicle: Vehicle | null }
  | { kind: "delete_owner" }
  | { kind: "delete_vehicle"; vehicle: Vehicle };

const VIEW: Mode = { kind: "view" };

export function AffiliateDetailSheet({
  owner,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: {
  owner: OwnerWithVehicles | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (owner: OwnerWithVehicles) => void;
  onDeleted: (ownerId: string) => void;
}) {
  const [mode, setMode] = useState<Mode>(VIEW);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<OwnerType>("servidor");
  const [primaryName, setPrimaryName] = useState("");
  const [secondaryName, setSecondaryName] = useState("");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [plate, setPlate] = useState("");
  const [modelColor, setModelColor] = useState("");

  const go = (next: Mode) => {
    setError(null);
    setMode(next);
  };

  const changePhoto = (next: PickedPhoto | null) => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(next);
  };

  const close = () => {
    if (saving) return;
    onClose();
    window.setTimeout(() => {
      changePhoto(null);
      go(VIEW);
    }, 300);
  };

  const startEditOwner = () => {
    if (!owner) return;
    setType(owner.type);
    setPrimaryName(owner.primary_name);
    setSecondaryName(owner.secondary_name ?? "");
    changePhoto(null);
    setRemovePhoto(false);
    go({ kind: "edit_owner" });
  };

  const startVehicleForm = (vehicle: Vehicle | null) => {
    setPlate(vehicle?.plate ?? "");
    setModelColor(vehicle?.model_color ?? "");
    go({ kind: "vehicle_form", vehicle });
  };

  const run = async (task: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const saveOwner = () =>
    run(async () => {
      if (!owner) return;
      const oldPhoto = owner.photo_url;
      let photoUrl = removePhoto ? null : oldPhoto;
      if (photo) photoUrl = await uploadOwnerPhoto(await compressImage(photo.file));

      const updated = await updateOwner(owner.id, {
        type,
        primary_name: primaryName,
        secondary_name: secondaryName,
        photo_url: photoUrl,
      });
      if (oldPhoto && oldPhoto !== photoUrl) await deleteOwnerPhoto(oldPhoto).catch(() => {});

      changePhoto(null);
      onUpdated({ ...updated, vehicles: owner.vehicles });
      go(VIEW);
    });

  const saveVehicle = (vehicle: Vehicle | null) =>
    run(async () => {
      if (!owner) return;
      const input = { plate, model_color: modelColor };
      const saved = vehicle
        ? await updateVehicle(vehicle.id, input)
        : await addVehicle(owner.id, input);
      const vehicles = vehicle
        ? owner.vehicles.map((v) => (v.id === saved.id ? saved : v))
        : [...owner.vehicles, saved];
      onUpdated({ ...owner, vehicles });
      go(VIEW);
    });

  const confirmDeleteVehicle = (vehicle: Vehicle) =>
    run(async () => {
      if (!owner) return;
      await deleteVehicle(vehicle.id);
      onUpdated({ ...owner, vehicles: owner.vehicles.filter((v) => v.id !== vehicle.id) });
      go(VIEW);
    });

  const confirmDeleteOwner = () =>
    run(async () => {
      if (!owner) return;
      await deleteOwner(owner);
      onDeleted(owner.id);
      onClose();
      window.setTimeout(() => go(VIEW), 300);
    });

  if (!owner) return null;

  const ownerFormValid =
    primaryName.trim().length > 0 && (type === "servidor" || secondaryName.trim().length > 0);

  const header = (() => {
    switch (mode.kind) {
      case "edit_owner":
        return { title: "Editar afiliado", description: ownerDisplayName(owner) };
      case "vehicle_form":
        return {
          title: mode.vehicle ? "Editar vehículo" : "Nuevo vehículo",
          description: mode.vehicle ? "El código QR se mantiene igual." : "Se generará un QR nuevo.",
        };
      case "delete_owner":
        return { title: "¿Eliminar afiliado?", description: ownerDisplayName(owner) };
      case "delete_vehicle":
        return { title: "¿Eliminar vehículo?", description: mode.vehicle.plate };
      default:
        return { title: ownerDisplayName(owner), description: OWNER_TYPE_LABEL[owner.type] };
    }
  })();

  const cancel = (
    <Button variant="secondary" size="lg" className="flex-1" disabled={saving} onClick={() => go(VIEW)}>
      Cancelar
    </Button>
  );

  const footer = (() => {
    switch (mode.kind) {
      case "edit_owner":
        return (
          <div className="flex gap-3">
            {cancel}
            <Button size="lg" className="flex-1" loading={saving} disabled={!ownerFormValid} onClick={saveOwner}>
              Guardar
            </Button>
          </div>
        );
      case "vehicle_form":
        return (
          <div className="flex gap-3">
            {cancel}
            <Button
              size="lg"
              className="flex-1"
              loading={saving}
              disabled={!plate.trim()}
              onClick={() => saveVehicle(mode.vehicle)}
            >
              {mode.vehicle ? "Guardar" : "Agregar"}
            </Button>
          </div>
        );
      case "delete_owner":
        return (
          <div className="flex gap-3">
            {cancel}
            <Button variant="danger" size="lg" className="flex-1" loading={saving} onClick={confirmDeleteOwner}>
              Eliminar
            </Button>
          </div>
        );
      case "delete_vehicle":
        return (
          <div className="flex gap-3">
            {cancel}
            <Button
              variant="danger"
              size="lg"
              className="flex-1"
              loading={saving}
              onClick={() => confirmDeleteVehicle(mode.vehicle)}
            >
              Eliminar
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={startEditOwner}>
              <Pencil className="size-5" />
              Editar
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1 text-exit"
              onClick={() => go({ kind: "delete_owner" })}
            >
              <Trash2 className="size-5" />
              Eliminar
            </Button>
          </div>
        );
    }
  })();

  const iconButton = "flex size-10 cursor-pointer items-center justify-center rounded-xl bg-white transition outline-none hover:bg-line focus-visible:ring-4 focus-visible:ring-accent/30";

  return (
    <BottomSheet
      open={open}
      onClose={close}
      desktopWidth="xl"
      title={header.title}
      description={header.description}
      footer={footer}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode.kind}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
        >
          {mode.kind === "view" && (
            <div>
              <div className="mb-6 flex justify-center">
                <Avatar src={owner.photo_url} name={owner.primary_name} size="xl" />
              </div>
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
                <CarFront className="size-5" />
                {owner.vehicles.length === 1 ? "1 vehículo" : `${owner.vehicles.length} vehículos`}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {owner.vehicles.map((v) => (
                  <QrPreview
                    key={v.id}
                    vehicle={v}
                    actions={
                      <>
                        <button
                          type="button"
                          aria-label={`Editar ${v.plate}`}
                          className={iconButton}
                          onClick={() => startVehicleForm(v)}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${v.plate}`}
                          className={`${iconButton} text-exit hover:bg-exit-soft`}
                          onClick={() => go({ kind: "delete_vehicle", vehicle: v })}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    }
                  />
                ))}
                <button
                  type="button"
                  onClick={() => startVehicleForm(null)}
                  className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-[1.75rem] border-2 border-dashed border-line text-base font-semibold text-muted transition hover:border-ink/30 hover:text-ink"
                >
                  <Plus className="size-5" />
                  Agregar vehículo
                </button>
              </div>
            </div>
          )}

          {mode.kind === "edit_owner" && (
            <div className="space-y-6">
              <OwnerTypeSelector value={type} onChange={setType} />
              <Input
                label={type === "pareja_tios" ? "Primera persona" : "Nombre completo"}
                value={primaryName}
                autoComplete="off"
                onChange={(e) => setPrimaryName(e.target.value)}
              />
              <AnimatePresence initial={false}>
                {type === "pareja_tios" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Input
                      label="Segunda persona"
                      value={secondaryName}
                      autoComplete="off"
                      onChange={(e) => setSecondaryName(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="pt-2">
                <PhotoPicker
                  photo={photo}
                  existingUrl={removePhoto ? null : owner.photo_url}
                  onChange={(p) => {
                    changePhoto(p);
                    if (p) setRemovePhoto(false);
                  }}
                  onRemoveExisting={() => setRemovePhoto(true)}
                />
              </div>
            </div>
          )}

          {mode.kind === "vehicle_form" && (
            <div className="space-y-4">
              <Input
                label="Placa"
                value={plate}
                autoCapitalize="characters"
                autoComplete="off"
                className="font-mono uppercase tracking-wider"
                onChange={(e) => setPlate(e.target.value)}
              />
              <Input
                label="Modelo y color"
                value={modelColor}
                onChange={(e) => setModelColor(e.target.value)}
              />
            </div>
          )}

          {(mode.kind === "delete_owner" || mode.kind === "delete_vehicle") && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-exit-soft text-exit">
                <AlertTriangle className="size-7" />
              </div>
              <p className="max-w-sm text-base text-muted">
                {mode.kind === "delete_owner"
                  ? `Se eliminarán también sus ${owner.vehicles.length} vehículo(s), sus códigos QR y todo su historial de entradas y salidas.`
                  : "Se eliminará su código QR y todo su historial de entradas y salidas."}{" "}
                Esta acción no se puede deshacer.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-2xl bg-exit-soft px-4 py-3 text-sm font-medium text-exit">
              {error}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </BottomSheet>
  );
}
