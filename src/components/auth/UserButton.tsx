"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { profileFullName } from "@/lib/supabase/profile";

export function UserButton() {
  const { profile, session } = useAuth();
  if (!session) return null;
  const name = profileFullName(profile ?? null) || session.user.email || "Usuario";

  return (
    <Link
      href="/perfil"
      prefetch
      aria-label="Editar perfil"
      className="shrink-0 rounded-full ring-4 ring-white transition outline-none hover:scale-105 focus-visible:ring-accent/40 active:scale-95"
    >
      <Avatar src={profile?.photo_url} name={name} size="sm" className="lg:size-12" />
    </Link>
  );
}
