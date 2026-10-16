"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, LayoutGrid, ScanLine, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Escanear", icon: ScanLine },
  { href: "/dashboard", label: "Estado", icon: LayoutGrid },
  { href: "/afiliados", label: "Afiliados", icon: UserPlus },
  { href: "/informes", label: "Informes", icon: FileText },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  // El indicador se mueve al tocar, sin esperar a que la nueva ruta termine de renderizar.
  const [pending, setPending] = useState<{ href: string; from: string } | null>(
    null,
  );
  const current =
    pending && pending.from === pathname ? pending.href : pathname;

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "fixed z-40",
        "inset-x-0 bottom-0 flex justify-center px-4 pb-[calc(var(--safe-bottom)+0.75rem)]",
        "lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-6 lg:-translate-y-1/2 lg:px-0 lg:pb-0",
      )}
    >
      <ul
        className={cn(
          "flex w-full max-w-md items-center justify-between gap-1 rounded-full bg-ink p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
          "lg:w-auto lg:flex-col lg:gap-2 lg:rounded-[2rem] lg:p-2.5",
        )}
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(current, href);
          return (
            <li key={href} className="flex-1 lg:w-full">
              <Link
                href={href}
                prefetch
                aria-current={isActive(pathname, href) ? "page" : undefined}
                onClick={() => setPending({ href, from: pathname })}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-colors duration-150 outline-none",
                  "focus-visible:ring-4 focus-visible:ring-white/30",
                  "lg:h-auto lg:w-24 lg:gap-1.5 lg:rounded-3xl lg:py-4 lg:text-xs",
                  active ? "text-ink" : "text-white/60 hover:text-white",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 rounded-full bg-white will-change-transform lg:rounded-3xl"
                    transition={{ type: "spring", stiffness: 600, damping: 40, mass: 0.7 }}
                  />
                )}
                <Icon className="relative size-6" strokeWidth={2.2} />
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
