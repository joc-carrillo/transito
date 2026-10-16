import { cn, initials } from "@/lib/utils";

const sizes = {
  xs: "size-5 text-[9px]",
  sm: "size-10 text-sm",
  md: "size-14 text-base",
  lg: "size-20 text-xl",
  xl: "size-28 text-3xl",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-accent-soft font-semibold text-accent",
        "flex items-center justify-center",
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="size-full object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
