"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Car } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { getSupabase } from "@/lib/supabase/client";
import { isCedulaAvailable } from "@/lib/supabase/profile";
import { errorMessage } from "@/lib/utils";
import {
  validatePasswords,
  validateProfileFields,
  type FieldErrors,
} from "@/lib/validation";

type Mode = "signin" | "signup";
type Field = "first_name" | "last_name" | "cedula" | "phone" | "email" | "password" | "confirm";

export function friendlyAuthError(err: unknown) {
  const message = errorMessage(err);
  if (/invalid login credentials/i.test(message)) return "Correo o contraseña incorrectos.";
  if (/email not confirmed/i.test(message)) return "Tu cuenta aún no está activa. Pide al administrador que desactive la confirmación por correo en Supabase.";
  if (/already registered|already been registered/i.test(message)) return "Ya existe una cuenta con ese correo.";
  if (/database error saving new user/i.test(message)) return "Esa cédula ya está registrada.";
  if (/at least 6 characters|weak password/i.test(message)) return "La contraseña debe tener al menos 6 caracteres.";
  if (/same.*password|different from the old/i.test(message)) return "La nueva contraseña debe ser distinta a la actual.";
  if (/rate limit/i.test(message)) return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  return message;
}

const EMPTY = {
  first_name: "",
  last_name: "",
  cedula: "",
  phone: "",
  email: "",
  password: "",
  confirm: "",
};

export function LoginView() {
  const [mode, setMode] = useState<Mode>("signin");
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cedulaTaken, setCedulaTaken] = useState(false);

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field === "cedula") setCedulaTaken(false);
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const fieldErrors: FieldErrors<Field> =
    mode === "signup"
      ? {
          ...validateProfileFields(form),
          ...validatePasswords(form.password, form.confirm, { required: true }),
          ...(cedulaTaken ? { cedula: "Esa cédula ya está registrada." } : {}),
        }
      : {};
  const shown = (field: Field) => (submitted ? fieldErrors[field] : undefined);

  const signIn = async () => {
    const { error } = await getSupabase().auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    if (error) throw error;
  };

  const signUp = async () => {
    setSubmitted(true);
    if (Object.keys(fieldErrors).length > 0) return;

    if (!(await isCedulaAvailable(form.cedula))) {
      setCedulaTaken(true);
      return;
    }

    const { data, error } = await getSupabase().auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
          cedula: form.cedula.trim(),
          phone: form.phone.trim(),
        },
      },
    });
    if (error) throw error;
    if (data.user && data.user.identities?.length === 0) {
      throw new Error("User already registered");
    }
    if (!data.session) await signIn();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await (mode === "signin" ? signIn() : signUp());
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const canSignIn = form.email.trim().length > 3 && form.password.length > 0;

  return (
    <div className="flex min-h-dvh items-stretch justify-center lg:items-center lg:p-8">
      <div className="flex w-full max-w-md flex-col px-6 pt-[calc(var(--safe-top)+3rem)] pb-[calc(var(--safe-bottom)+1.5rem)] lg:rounded-[2.5rem] lg:bg-white lg:p-10 lg:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="mb-8">
          <div className="mb-6 flex size-16 items-center justify-center rounded-[1.4rem] bg-ink text-white">
            <Car className="size-8" strokeWidth={2.2} />
          </div>
          <h1 className="text-[2.6rem] leading-[1.02] font-bold tracking-tight">
            {mode === "signin" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
          </h1>
          <p className="mt-3 text-lg text-muted">
            Control de tránsito y acceso vehicular.
          </p>
        </div>

            <form
              noValidate
              onSubmit={submit}
              className="flex flex-1 flex-col"
            >
              <SegmentedTabs
                className="mb-6"
                value={mode}
                onChange={(m) => {
                  setMode(m);
                  setError(null);
                  setSubmitted(false);
                }}
                options={[
                  { value: "signin", label: "Entrar" },
                  { value: "signup", label: "Crear cuenta" },
                ]}
              />

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {mode === "signup" && (
                    <motion.div
                      key="signup-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="-m-1 space-y-4 overflow-hidden p-1"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Nombre"
                          placeholder="María"
                          autoComplete="given-name"
                          value={form.first_name}
                          onChange={set("first_name")}
                          error={shown("first_name")}
                        />
                        <Input
                          label="Apellido"
                          placeholder="González"
                          autoComplete="family-name"
                          value={form.last_name}
                          onChange={set("last_name")}
                          error={shown("last_name")}
                        />
                      </div>
                      <Input
                        label="Cédula"
                        placeholder="Número de cédula"
                        inputMode="numeric"
                        autoComplete="off"
                        value={form.cedula}
                        onChange={set("cedula")}
                        error={shown("cedula")}
                      />
                      <Input
                        label="Teléfono"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="Número de teléfono"
                        value={form.phone}
                        onChange={set("phone")}
                        error={shown("phone")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Input
                  label="Correo electrónico"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder="tu@correo.com"
                  value={form.email}
                  onChange={set("email")}
                  error={shown("email")}
                />
                <PasswordInput
                  label="Contraseña"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder={mode === "signin" ? "Tu contraseña" : "Mínimo 6 caracteres"}
                  value={form.password}
                  onChange={set("password")}
                  error={shown("password")}
                />
                <AnimatePresence initial={false}>
                  {mode === "signup" && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="-m-1 overflow-hidden p-1"
                    >
                      <PasswordInput
                        label="Confirmar contraseña"
                        autoComplete="new-password"
                        placeholder="Repite la contraseña"
                        value={form.confirm}
                        onChange={set("confirm")}
                        error={
                          shown("confirm") ??
                          (form.confirm && form.confirm !== form.password
                            ? "Las contraseñas no coinciden."
                            : undefined)
                        }
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <p className="mt-4 rounded-2xl bg-exit-soft px-4 py-3 text-sm font-medium text-exit">
                  {error}
                </p>
              )}

              <div className="mt-auto pt-8 lg:pt-10">
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={mode === "signin" && !canSignIn}
                >
                  {mode === "signin" ? "Entrar" : "Crear cuenta"}
                  <ArrowRight className="size-5" />
                </Button>
              </div>
            </form>
      </div>
    </div>
  );
}
