"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/utils";
import type { Vehicle } from "@/types/database";

const EXPORT_QR_SIZE = 720;

function fileName(plate: string) {
  const safe = plate.replace(/[^\w.-]+/g, "-").replace(/^-|-$/g, "") || "vehiculo";
  return `qr-${safe}.png`;
}

function labelBlob(source: HTMLCanvasElement, vehicle: Vehicle) {
  const pad = 64;
  const textArea = 170;
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_QR_SIZE + pad * 2;
  canvas.height = EXPORT_QR_SIZE + pad * 2 + textArea;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("No se pudo crear la imagen."));

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, pad, pad, EXPORT_QR_SIZE, EXPORT_QR_SIZE);

  ctx.fillStyle = "#0c0c0e";
  ctx.textAlign = "center";
  ctx.font = "bold 88px ui-monospace, Menlo, monospace";
  ctx.fillText(vehicle.plate, canvas.width / 2, EXPORT_QR_SIZE + pad + 100);
  if (vehicle.model_color) {
    ctx.fillStyle = "#6e6e73";
    ctx.font = "500 40px system-ui, sans-serif";
    ctx.fillText(vehicle.model_color, canvas.width / 2, EXPORT_QR_SIZE + pad + 160);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}

function wantsShareSheet() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1);
}

async function saveLabel(source: HTMLCanvasElement, vehicle: Vehicle) {
  const blob = await labelBlob(source, vehicle);
  const name = fileName(vehicle.plate);
  const file = new File([blob], name, { type: "image/png" });

  if (wantsShareSheet() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: vehicle.plate });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function QrPreview({
  vehicle,
  actions,
}: {
  vehicle: Vehicle;
  actions?: React.ReactNode;
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveLabel(canvas, vehicle);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center rounded-[1.75rem] bg-soft p-5">
      <div ref={qrRef} className="rounded-3xl bg-white p-4">
        <QRCodeCanvas value={vehicle.qr_code_hash} size={180} level="M" marginSize={0} />
      </div>
      <p className="mt-4 font-mono text-2xl font-bold tracking-wider">{vehicle.plate}</p>
      {vehicle.model_color && (
        <p className="text-sm font-medium text-muted">{vehicle.model_color}</p>
      )}
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="bg-white"
          loading={saving}
          onClick={download}
        >
          <Download className="size-4" />
          Descargar QR
        </Button>
        {actions}
      </div>
      {error && <p className="mt-3 text-center text-sm font-medium text-exit">{error}</p>}
    </div>
  );
}
