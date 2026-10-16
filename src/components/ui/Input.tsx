import { useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string | null;
}

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label htmlFor={inputId} className="block">
      {label && (
        <span className="mb-2 block text-sm font-medium text-muted">
          {label}
        </span>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-14 w-full rounded-2xl bg-soft px-5 text-lg font-medium text-ink outline-none transition",
          "placeholder:text-muted/70 focus:bg-white focus:ring-4 focus:ring-accent/20",
          error && "ring-2 ring-exit/60 focus:ring-exit/30",
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-exit">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      )}
    </label>
  );
}
