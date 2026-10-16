import { cn } from "@/lib/utils";
import { UserButton } from "@/components/auth/UserButton";

const widths = {
  narrow: "max-w-md md:max-w-2xl",
  wide: "max-w-md md:max-w-3xl lg:max-w-6xl",
} as const;

export function Page({
  children,
  width = "wide",
  className,
}: {
  children: React.ReactNode;
  width?: keyof typeof widths;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 pt-[calc(var(--safe-top)+1.5rem)] md:px-8 lg:pt-12",
        widths[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  showUser = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  showUser?: boolean;
}) {
  return (
    <header className="mb-6 flex items-stretch justify-between gap-4 lg:mb-10">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[2.25rem] leading-[1.05] font-bold tracking-tight lg:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-base text-muted lg:text-lg">{subtitle}</p>
        )}
      </div>
      {(showUser || action) && (
        <div className="flex shrink-0 flex-col items-end justify-between gap-3">
          {showUser ? <UserButton /> : <span />}
          {action}
        </div>
      )}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-line px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-soft text-muted">
        {icon}
      </div>
      <p className="text-lg font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
      )}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-2xl bg-exit-soft px-5 py-4 text-sm font-medium text-exit">
      {message}
    </div>
  );
}
