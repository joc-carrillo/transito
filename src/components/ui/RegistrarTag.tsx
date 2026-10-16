import { UserCheck } from "lucide-react";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

export function RegistrarTag({
  name,
  photoUrl,
  className,
}: {
  name: string | null;
  photoUrl?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted",
        className,
      )}
    >
      {photoUrl !== undefined && name ? (
        <Avatar src={photoUrl} name={name} size="xs" />
      ) : (
        <UserCheck className="size-3.5 shrink-0" />
      )}
      <span className="truncate">{name ? `Marcó ${name}` : "Sin registro de quién marcó"}</span>
    </span>
  );
}
