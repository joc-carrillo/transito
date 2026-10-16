"use client";

import { useState } from "react";
import { ArrowRight, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { PhotoPicker, type PickedPhoto } from "@/components/afiliados/PhotoPicker";
import { Button } from "@/components/ui/Button";
import { getSupabase } from "@/lib/supabase/client";
import { saveMyProfile, uploadAvatar } from "@/lib/supabase/profile";
import { compressImage } from "@/lib/image";
import { errorMessage } from "@/lib/utils";

export function ProfilePhotoStep() {
  const { session, profile, setProfile } = useAuth();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!session) return null;

  const firstName =
    profile?.first_name || (session.user.user_metadata?.first_name as string | undefined) || "";

  const save = async () => {
    if (!photo) return;
    setSaving(true);
    setError(null);
    try {
      const url = await uploadAvatar(session.user.id, await compressImage(photo.file, 640));
      setProfile(await saveMyProfile(session.user.id, { photo_url: url }));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-stretch justify-center lg:items-center lg:p-8">
      <div className="flex w-full max-w-md flex-col px-6 pt-[calc(var(--safe-top)+3rem)] pb-[calc(var(--safe-bottom)+1.5rem)] lg:rounded-[2.5rem] lg:bg-white lg:p-10 lg:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <p className="mb-1 text-sm font-semibold tracking-wider text-muted uppercase">
          Último paso
        </p>
        <h1 className="text-[2.4rem] leading-[1.05] font-bold tracking-tight">
          {firstName ? `${firstName}, agrega tu foto` : "Agrega tu foto de perfil"}
        </h1>
        <p className="mt-3 mb-10 text-lg text-muted">
          Es obligatoria para usar el sistema. Así tu equipo sabe quién registra cada movimiento.
        </p>

        <PhotoPicker photo={photo} onChange={setPhoto} camera="user" />

        {error && (
          <p className="mt-6 rounded-2xl bg-exit-soft px-4 py-3 text-sm font-medium text-exit">
            {error}
          </p>
        )}

        <div className="mt-auto space-y-3 pt-10">
          <Button size="lg" fullWidth disabled={!photo} loading={saving} onClick={save}>
            Continuar
            <ArrowRight className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => getSupabase().auth.signOut()}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
