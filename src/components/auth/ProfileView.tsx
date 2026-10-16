"use client";

import { useState } from "react";
import { Check, KeyRound, LogOut, Mail, UserRound } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { friendlyAuthError } from "./LoginView";
import { PhotoPicker, type PickedPhoto } from "@/components/afiliados/PhotoPicker";
import { Page, PageHeader } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { getSupabase } from "@/lib/supabase/client";
import {
  deleteAvatar,
  isCedulaAvailable,
  profileFullName,
  saveMyProfile,
  uploadAvatar,
} from "@/lib/supabase/profile";
import { compressImage } from "@/lib/image";
import { errorMessage } from "@/lib/utils";
import { validatePasswords, validateProfileFields } from "@/lib/validation";
import type { Profile } from "@/types/database";

type Feedback = { kind: "ok" | "error"; text: string } | null;

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p
      className={
        feedback.kind === "ok"
          ? "mt-4 flex items-center gap-2 rounded-2xl bg-entry-soft px-4 py-3 text-sm font-medium text-entry"
          : "mt-4 rounded-2xl bg-exit-soft px-4 py-3 text-sm font-medium text-exit"
      }
    >
      {feedback.kind === "ok" && <Check className="size-4 shrink-0" />}
      {feedback.text}
    </p>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-2 text-xl font-bold tracking-tight">
      <span className="flex size-9 items-center justify-center rounded-full bg-soft text-muted">
        {icon}
      </span>
      {children}
    </h2>
  );
}

function PhotoSection({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [pending, setPending] = useState<PickedPhoto | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const pick = async (photo: PickedPhoto | null) => {
    if (!photo || pending) return;
    setPending(photo);
    setFeedback(null);
    try {
      const url = await uploadAvatar(profile.id, await compressImage(photo.file, 640));
      const saved = await saveMyProfile(profile.id, { photo_url: url });
      await deleteAvatar(profile.photo_url).catch(() => {});
      onSaved(saved);
      setFeedback({ kind: "ok", text: "Foto actualizada." });
    } catch (err) {
      setFeedback({ kind: "error", text: errorMessage(err) });
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="p-6 lg:p-8">
      <PhotoPicker photo={pending} existingUrl={profile.photo_url} onChange={pick} camera="user" />
      {pending && <p className="mt-4 text-center text-sm font-medium text-muted">Subiendo foto…</p>}
      <FeedbackLine feedback={feedback} />
    </Card>
  );
}

function DetailsSection({
  profile,
  email,
  onSaved,
}: {
  profile: Profile;
  email: string;
  onSaved: (p: Profile) => void;
}) {
  const initial = {
    first_name: profile.first_name,
    last_name: profile.last_name,
    cedula: profile.cedula ?? "",
    phone: profile.phone,
  };
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [cedulaTaken, setCedulaTaken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const errors = {
    ...validateProfileFields({ ...form, email }),
    ...(cedulaTaken ? { cedula: "Esa cédula ya está registrada." } : {}),
  };
  const shown = (k: keyof typeof form) => (submitted ? errors[k] : undefined);
  const dirty = (Object.keys(initial) as (keyof typeof form)[]).some(
    (k) => form[k].trim() !== initial[k],
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (k === "cedula") setCedulaTaken(false);
    setFeedback(null);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      if (
        form.cedula.trim() !== initial.cedula &&
        !(await isCedulaAvailable(form.cedula, profile.id))
      ) {
        setCedulaTaken(true);
        return;
      }
      onSaved(await saveMyProfile(profile.id, form));
      setSubmitted(false);
      setFeedback({ kind: "ok", text: "Datos guardados." });
    } catch (err) {
      const msg = errorMessage(err);
      setFeedback({
        kind: "error",
        text: /duplicate key|23505/i.test(msg) ? "Esa cédula ya está registrada." : msg,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 lg:p-8">
      <SectionTitle icon={<UserRound className="size-5" />}>Datos personales</SectionTitle>
      <form noValidate onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" autoComplete="given-name" value={form.first_name} onChange={set("first_name")} error={shown("first_name")} />
          <Input label="Apellido" autoComplete="family-name" value={form.last_name} onChange={set("last_name")} error={shown("last_name")} />
        </div>
        <Input label="Cédula" inputMode="numeric" autoComplete="off" value={form.cedula} onChange={set("cedula")} error={shown("cedula")} />
        <Input label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={shown("phone")} />
        <Button type="submit" size="md" fullWidth loading={saving} disabled={!dirty}>
          Guardar cambios
        </Button>
      </form>
      <FeedbackLine feedback={feedback} />
    </Card>
  );
}

function EmailSection({ currentEmail, pendingEmail }: { currentEmail: string; pendingEmail?: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(
    pendingEmail
      ? { kind: "ok", text: `Cambio pendiente a ${pendingEmail}. Confírmalo desde ese correo.` }
      : null,
  );
  const trimmed = email.trim();
  const invalid = validateProfileFields({
    first_name: "x",
    last_name: "x",
    cedula: "00000",
    phone: "0000000",
    email: trimmed,
  }).email;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return setFeedback({ kind: "error", text: invalid });
    setSaving(true);
    setFeedback(null);
    const { data, error } = await getSupabase().auth.updateUser({ email: trimmed });
    setSaving(false);
    if (error) return setFeedback({ kind: "error", text: friendlyAuthError(error) });
    const applied = data.user.email?.toLowerCase() === trimmed.toLowerCase();
    setFeedback(
      applied
        ? { kind: "ok", text: "Correo actualizado." }
        : {
            kind: "ok",
            text: `Cambio pendiente a ${trimmed}. Se aplica al confirmarlo desde ese correo.`,
          },
    );
  };

  return (
    <Card className="p-6 lg:p-8">
      <SectionTitle icon={<Mail className="size-5" />}>Correo electrónico</SectionTitle>
      <form noValidate onSubmit={save} className="space-y-4">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          type="submit"
          size="md"
          fullWidth
          loading={saving}
          disabled={trimmed.toLowerCase() === currentEmail.toLowerCase()}
        >
          Cambiar correo
        </Button>
      </form>
      <FeedbackLine feedback={feedback} />
    </Card>
  );
}

function PasswordSection() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const errors = validatePasswords(password, confirm, { required: true });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    setFeedback(null);
    const { error } = await getSupabase().auth.updateUser({ password });
    setSaving(false);
    if (error) return setFeedback({ kind: "error", text: friendlyAuthError(error) });
    setPassword("");
    setConfirm("");
    setSubmitted(false);
    setFeedback({ kind: "ok", text: "Contraseña actualizada." });
  };

  return (
    <Card className="p-6 lg:p-8">
      <SectionTitle icon={<KeyRound className="size-5" />}>Contraseña</SectionTitle>
      <form noValidate onSubmit={save} className="space-y-4">
        <PasswordInput
          label="Nueva contraseña"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFeedback(null);
          }}
          error={submitted ? errors.password : undefined}
        />
        <PasswordInput
          label="Confirmar contraseña"
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setFeedback(null);
          }}
          error={
            (submitted && errors.confirm) ||
            (confirm && confirm !== password ? "Las contraseñas no coinciden." : undefined)
          }
        />
        <Button type="submit" size="md" fullWidth loading={saving} disabled={!password}>
          Cambiar contraseña
        </Button>
      </form>
      <FeedbackLine feedback={feedback} />
    </Card>
  );
}

function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);
  return (
    <Button
      variant="secondary"
      size="lg"
      fullWidth
      loading={signingOut}
      className="text-exit"
      onClick={async () => {
        setSigningOut(true);
        await getSupabase().auth.signOut();
      }}
    >
      <LogOut className="size-5" />
      Cerrar sesión
    </Button>
  );
}

export function ProfileView() {
  const { session, profile, setProfile } = useAuth();
  if (!session || !profile) return null;

  const user = session.user;
  const email = user.email ?? "";

  return (
    <Page>
      <PageHeader
        eyebrow="Tu cuenta"
        title="Editar perfil"
        subtitle={profileFullName(profile) || email}
        showUser={false}
      />

      <div className="space-y-4 lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0">
        <div className="space-y-4 lg:sticky lg:top-8">
          <PhotoSection profile={profile} onSaved={setProfile} />
          <div className="hidden lg:block">
            <SignOutButton />
          </div>
        </div>

        <div className="space-y-4">
          <DetailsSection profile={profile} email={email} onSaved={setProfile} />
          <EmailSection currentEmail={email} pendingEmail={user.new_email} />
          <PasswordSection />
          <div className="pt-2 lg:hidden">
            <SignOutButton />
          </div>
        </div>
      </div>
    </Page>
  );
}
