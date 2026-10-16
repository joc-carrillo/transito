"use client";

import { useRef } from "react";
import { Camera, ImagePlus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface PickedPhoto {
  file: File;
  url: string;
}

export function PhotoPicker({
  photo,
  existingUrl = null,
  onChange,
  onRemoveExisting,
  camera = "environment",
}: {
  photo: PickedPhoto | null;
  existingUrl?: string | null;
  onChange: (photo: PickedPhoto | null) => void;
  onRemoveExisting?: () => void;
  camera?: "user" | "environment";
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const previewUrl = photo?.url ?? existingUrl;

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange({ file, url: URL.createObjectURL(file) });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-6 flex size-44 items-center justify-center overflow-hidden rounded-full bg-soft ring-8 ring-soft/60">
        {previewUrl ? (
          <img src={previewUrl} alt="Vista previa" className="size-full object-cover" />
        ) : (
          <User className="size-16 text-muted/60" />
        )}
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <Button variant="primary" size="lg" onClick={() => cameraRef.current?.click()}>
          <Camera className="size-5" />
          Tomar foto
        </Button>
        <Button variant="secondary" size="lg" onClick={() => galleryRef.current?.click()}>
          <ImagePlus className="size-5" />
          Subir
        </Button>
      </div>

      {(photo || (existingUrl && onRemoveExisting)) && (
        <button
          type="button"
          onClick={() => (photo ? onChange(null) : onRemoveExisting?.())}
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-exit transition hover:bg-exit-soft"
        >
          <Trash2 className="size-4" />
          Quitar foto
        </button>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture={camera}
        className="hidden"
        onChange={handle}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handle}
      />
    </div>
  );
}
