"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string | null;
}

export function PasswordInput({ label, error, className, id, ...props }: PasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className={cn(
            "h-14 w-full rounded-2xl bg-soft pr-14 pl-5 text-lg font-medium text-ink outline-none transition",
            "placeholder:text-muted/70 focus:bg-white focus:ring-4 focus:ring-accent/20",
            error && "ring-2 ring-exit/60 focus:ring-exit/30",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-muted transition outline-none hover:bg-line hover:text-ink focus-visible:ring-4 focus-visible:ring-accent/30"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-exit">{error}</p>}
    </div>
  );
}
