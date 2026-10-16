"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "entry"
  | "exit"
  | "secondary"
  | "ghost"
  | "accent"
  | "danger";
type Size = "xl" | "lg" | "md" | "sm" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90",
  entry: "bg-entry text-white hover:brightness-105",
  exit: "bg-ink text-white hover:bg-ink/90",
  accent: "bg-accent text-white hover:brightness-105",
  secondary: "bg-soft text-ink hover:bg-line",
  ghost: "bg-transparent text-ink hover:bg-soft",
  danger: "bg-exit text-white hover:brightness-105",
};

const sizes: Record<Size, string> = {
  xl: "h-20 rounded-[1.75rem] px-6 text-xl",
  lg: "h-16 rounded-2xl px-6 text-lg",
  md: "h-12 rounded-2xl px-5 text-base",
  sm: "h-10 rounded-xl px-4 text-sm",
  icon: "h-11 w-11 rounded-full",
};

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "lg",
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex cursor-pointer select-none items-center justify-center gap-2 font-semibold tracking-tight transition-[background-color,filter,opacity] outline-none",
        "focus-visible:ring-4 focus-visible:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-5 animate-spin" /> : children}
    </motion.button>
  );
}
