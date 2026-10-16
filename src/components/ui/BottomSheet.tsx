"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useIsDesktop } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const desktopWidths = {
  md: "lg:max-w-md",
  lg: "lg:max-w-lg",
  xl: "lg:max-w-2xl",
} as const;

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "full" ocupa casi toda la pantalla en móvil (formularios largos). */
  size?: "auto" | "full";
  desktopWidth?: keyof typeof desktopWidths;
}

const subscribeNoop = () => () => {};

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "auto",
  desktopWidth = "lg",
}: BottomSheetProps) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const isDesktop = useIsDesktop();
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const motionProps = isDesktop
    ? {
        initial: { opacity: 0, scale: 0.96, y: 24 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.97, y: 16 },
      }
    : {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-8">
          <motion.div
            className="absolute inset-0 bg-ink/45 will-change-[opacity]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            {...motionProps}
            transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.8 }}
            drag={isDesktop ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className={cn(
              "relative flex w-full flex-col bg-white shadow-2xl will-change-transform",
              "max-h-[94dvh] rounded-t-[2rem]",
              "lg:max-h-[88vh] lg:rounded-[2rem]",
              size === "full" && "h-[94dvh] lg:h-auto",
              desktopWidths[desktopWidth],
            )}
          >
            <div
              className="touch-none cursor-grab px-6 pt-3 active:cursor-grabbing lg:cursor-default lg:pt-6"
              onPointerDown={(e) => !isDesktop && dragControls.start(e)}
            >
              <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-line lg:hidden" />
              {(title || description) && (
                <div className="flex items-start justify-between gap-4 pb-2">
                  <div>
                    {title && (
                      <h2 className="text-2xl font-bold tracking-tight">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-1 text-base text-muted">{description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Cerrar"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onClose}
                    className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line focus-visible:ring-4 focus-visible:ring-accent/30 outline-none"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
              {children}
            </div>

            {footer && (
              <div className="border-t border-line/60 bg-white px-6 pt-4 pb-[calc(var(--safe-bottom)+1.25rem)] lg:rounded-b-[2rem] lg:pb-6">
                {footer}
              </div>
            )}
            {!footer && <div className="pb-[calc(var(--safe-bottom)+0.75rem)]" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
