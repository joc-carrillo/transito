"use client";

import { motion } from "framer-motion";
import { Heart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OwnerType } from "@/types/database";

const TYPE_OPTIONS: {
  value: OwnerType;
  title: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  { value: "servidor", title: "Servidor", description: "Una persona", icon: UserRound },
  {
    value: "pareja_tios",
    title: "Pareja de tíos",
    description: "Dos personas, un registro",
    icon: Heart,
  },
];

export function OwnerTypeSelector({
  value,
  onChange,
}: {
  value: OwnerType;
  onChange: (type: OwnerType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TYPE_OPTIONS.map(({ value: option, title, description, icon: Icon }) => {
        const active = value === option;
        return (
          <motion.button
            key={option}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(option)}
            aria-pressed={active}
            className={cn(
              "flex cursor-pointer flex-col items-start rounded-[1.75rem] border-2 p-4 text-left transition-colors outline-none focus-visible:ring-4 focus-visible:ring-accent/30",
              active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/30",
            )}
          >
            <span
              className={cn(
                "mb-6 flex size-10 items-center justify-center rounded-full",
                active ? "bg-white/15" : "bg-soft",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="text-lg leading-tight font-bold">{title}</span>
            <span className={cn("text-sm", active ? "text-white/70" : "text-muted")}>
              {description}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
