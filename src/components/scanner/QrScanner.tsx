"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CameraOff, RotateCcw } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const READER_ID = "qr-reader";

type CameraState = "starting" | "running" | "error";

export function QrScanner({
  paused,
  onScan,
  className,
}: {
  paused: boolean;
  onScan: (text: string) => void;
  className?: string;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  const [state, setState] = useState<CameraState>("starting");
  const [errorText, setErrorText] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onScanRef.current = onScan;
    pausedRef.current = paused;
  }, [onScan, paused]);

  useEffect(() => {
    let cancelled = false;
    let instance: Html5Qrcode | null = null;
    let starting: Promise<unknown> | null = null;

    (async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );
      if (cancelled) return;

      instance = new Html5Qrcode(READER_ID, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        useBarCodeDetectorIfSupported: true,
      });
      scannerRef.current = instance;

      starting = instance.start(
        { facingMode: "environment" },
        {
          fps: 10,
          // html5-qrcode exige >= 50px; el visor mide 0 mientras la cámara arranca.
          qrbox: (w, h) => {
            const side = Math.max(50, Math.floor(Math.min(w, h) * 0.7));
            return { width: side, height: side };
          },
          aspectRatio: 1,
        },
        (text) => {
          if (!pausedRef.current) onScanRef.current(text);
        },
        () => {},
      );

      try {
        await starting;
        if (!cancelled) setState("running");
      } catch (err) {
        if (cancelled) return;
        setState("error");
        const message = err instanceof Error ? err.message : String(err);
        setErrorText(
          /permission|notallowed/i.test(message)
            ? "Permite el acceso a la cámara para escanear."
            : /notfound|no camera|requested device/i.test(message)
              ? "No se encontró ninguna cámara en este dispositivo."
              : "No se pudo iniciar la cámara.",
        );
      }
    })();

    return () => {
      cancelled = true;
      const current = instance;
      scannerRef.current = null;
      if (!current) return;
      Promise.resolve(starting)
        .catch(() => {})
        .then(async () => {
          try {
            if (current.isScanning) await current.stop();
            current.clear();
          } catch {
            /* la cámara ya estaba detenida */
          }
        });
    };
  }, [attempt]);

  // Detener la decodificación mientras hay un sheet abierto libera el hilo principal para las animaciones.
  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || state !== "running") return;
    try {
      if (paused) scanner.pause(true);
      else scanner.resume();
    } catch {
      /* ya estaba en ese estado */
    }
  }, [paused, state]);

  const retry = useCallback(() => {
    setState("starting");
    setErrorText("");
    setAttempt((n) => n + 1);
  }, []);

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-[2rem] bg-ink",
        className,
      )}
    >
      <div id={READER_ID} key={attempt} className="absolute inset-0" />

      {state === "running" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative size-[70%]">
            {(
              [
                "top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl",
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl",
              ] as const
            ).map((pos) => (
              <span
                key={pos}
                className={cn("absolute size-12 border-white", pos)}
              />
            ))}
            {!paused && (
              <motion.div
                className="absolute inset-0 will-change-transform"
                initial={{ y: "-42%" }}
                animate={{ y: ["-42%", "42%", "-42%"] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="absolute inset-x-4 top-1/2 h-0.5 rounded-full bg-white/80 shadow-[0_0_16px_rgba(255,255,255,0.9)]" />
              </motion.div>
            )}
          </div>
        </div>
      )}

      {state === "running" && paused && (
        <div className="absolute inset-0 bg-ink/60" />
      )}

      {state === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
          <span className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm font-medium">Iniciando cámara…</p>
        </div>
      )}

      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center text-white">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/10">
            <CameraOff className="size-7" />
          </div>
          <p className="text-lg font-semibold">{errorText}</p>
          <Button variant="secondary" size="md" onClick={retry}>
            <RotateCcw className="size-4" />
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
