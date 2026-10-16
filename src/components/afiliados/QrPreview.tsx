"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Vehicle } from "@/types/database";

const EXPORT_QR_SIZE = 720;

function downloadLabel(source: HTMLCanvasElement, vehicle: Vehicle) {
  const pad = 64;
  const textArea = 170;
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_QR_SIZE + pad * 2;
  canvas.height = EXPORT_QR_SIZE + pad * 2 + textArea;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

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

  const link = document.createElement("a");
  link.download = `qr-${vehicle.plate}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function QrPreview({
  vehicle,
  actions,
}: {
  vehicle: Vehicle;
  actions?: React.ReactNode;
}) {
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col items-center rounded-[1.75rem] bg-soft p-5">
      <div className="rounded-3xl bg-white p-4">
        <QRCodeCanvas
          value={vehicle.qr_code_hash}
          size={180}
          level="M"
          marginSize={0}
        />
      </div>
      <div ref={exportRef} className="hidden" aria-hidden>
        <QRCodeCanvas
          value={vehicle.qr_code_hash}
          size={EXPORT_QR_SIZE}
          level="M"
          marginSize={0}
        />
      </div>
      <p className="mt-4 font-mono text-2xl font-bold tracking-wider">
        {vehicle.plate}
      </p>
      {vehicle.model_color && (
        <p className="text-sm font-medium text-muted">{vehicle.model_color}</p>
      )}
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="bg-white"
          onClick={() => {
            const canvas = exportRef.current?.querySelector("canvas");
            if (canvas) downloadLabel(canvas, vehicle);
          }}
        >
          <Download className="size-4" />
          Descargar QR
        </Button>
        {actions}
      </div>
    </div>
  );
}
