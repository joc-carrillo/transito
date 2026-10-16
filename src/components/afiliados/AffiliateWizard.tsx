"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhotoPicker, type PickedPhoto } from "./PhotoPicker";
import { OwnerTypeSelector } from "./OwnerTypeSelector";
import { VehicleFields, type VehicleDraft } from "./VehicleFields";
import { QrPreview } from "./QrPreview";
import { createAffiliate, uploadOwnerPhoto } from "@/lib/supabase/queries";
import { compressImage } from "@/lib/image";
import { cn, errorMessage, normalizePlate } from "@/lib/utils";
import type { OwnerType, OwnerWithVehicles } from "@/types/database";

const STEPS = ["Datos", "Foto", "Vehículos"] as const;

let draftSeq = 0;

const newVehicle = (): VehicleDraft => ({
  key: `vehicle-${++draftSeq}`,
  plate: "",
  model_color: "",
});

export function friendlyError(err: unknown) {
  const code = (err as { code?: string })?.code;
  if (code === "23505") return "Esa placa ya está registrada.";
  return errorMessage(err);
}

export function AffiliateWizard({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (owner: OwnerWithVehicles) => void;
}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [type, setType] = useState<OwnerType>("servidor");
  const [primaryName, setPrimaryName] = useState("");
  const [secondaryName, setSecondaryName] = useState("");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [vehicles, setVehicles] = useState<VehicleDraft[]>(() => [newVehicle()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<OwnerWithVehicles | null>(null);

  const changePhoto = (next: PickedPhoto | null) => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(next);
  };

  const reset = () => {
    setStep(0);
    setType("servidor");
    setPrimaryName("");
    setSecondaryName("");
    changePhoto(null);
    setVehicles([newVehicle()]);
    setError(null);
    setCreated(null);
  };

  const close = () => {
    if (saving) return;
    onClose();
    window.setTimeout(reset, 300);
  };

  const filledVehicles = vehicles.filter((v) => v.plate.trim());
  const plates = filledVehicles.map((v) => normalizePlate(v.plate));
  const hasDuplicatePlates = new Set(plates).size !== plates.length;

  const canContinue =
    step === 0
      ? primaryName.trim().length > 0 &&
        (type === "servidor" || secondaryName.trim().length > 0)
      : step === 1
        ? true
        : filledVehicles.length > 0 && !hasDuplicatePlates;

  const go = (delta: number) => {
    setDirection(delta);
    setError(null);
    setStep((s) => s + delta);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const photoUrl = photo
        ? await uploadOwnerPhoto(await compressImage(photo.file))
        : null;
      const owner = await createAffiliate({
        type,
        primary_name: primaryName,
        secondary_name: type === "pareja_tios" ? secondaryName : null,
        photo_url: photoUrl,
        vehicles: filledVehicles,
      });
      setCreated(owner);
      onCreated(owner);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const isLast = step === STEPS.length - 1;

  return (
    <BottomSheet
      open={open}
      onClose={close}
      size="full"
      desktopWidth="xl"
      title={created ? "¡Registro listo!" : "Nuevo afiliado"}
      description={
        created
          ? "Descarga o imprime los códigos QR de cada vehículo."
          : `Paso ${step + 1} de ${STEPS.length} · ${STEPS[step]}`
      }
      footer={
        created ? (
          <Button size="lg" fullWidth onClick={close}>
            <Check className="size-5" />
            Listo
          </Button>
        ) : (
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                variant="secondary"
                size="lg"
                aria-label="Atrás"
                className="w-16 px-0"
                disabled={saving}
                onClick={() => go(-1)}
              >
                <ArrowLeft className="size-5" />
              </Button>
            )}
            <Button
              size="lg"
              variant={isLast ? "accent" : "primary"}
              className="flex-1"
              disabled={!canContinue}
              loading={saving}
              onClick={() => (isLast ? submit() : go(1))}
            >
              {isLast ? "Guardar y generar QR" : step === 1 && !photo ? "Omitir por ahora" : "Continuar"}
              {!isLast && <ArrowRight className="size-5" />}
            </Button>
          </div>
        )
      }
    >
      {!created && (
        <div className="mb-6 flex gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-ink" : "bg-soft",
              )}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        {created ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {created.vehicles.map((v) => (
              <QrPreview key={v.id} vehicle={v} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <OwnerTypeSelector value={type} onChange={setType} />

                <Input
                  label={type === "pareja_tios" ? "Primera persona" : "Nombre completo"}
                  placeholder="Ej. María González"
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
                        placeholder="Ej. José Pérez"
                        value={secondaryName}
                        autoComplete="off"
                        onChange={(e) => setSecondaryName(e.target.value)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {step === 1 && (
              <div className="py-2">
                <p className="mb-6 text-center text-base text-muted">
                  {type === "pareja_tios"
                    ? "Una foto de la pareja o del conductor habitual."
                    : "Una foto clara del rostro del conductor."}
                </p>
                <PhotoPicker photo={photo} onChange={changePhoto} />
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="mb-4 text-base text-muted">
                  Cada vehículo recibirá su propio código QR.
                </p>
                <VehicleFields
                  vehicles={vehicles}
                  onChange={setVehicles}
                  onAdd={() => setVehicles((vs) => [...vs, newVehicle()])}
                />
                {hasDuplicatePlates && (
                  <p className="mt-3 text-sm font-medium text-exit">
                    Hay placas repetidas.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-4 rounded-2xl bg-exit-soft px-4 py-3 text-sm font-medium text-exit">
          {error}
        </p>
      )}
    </BottomSheet>
  );
}
