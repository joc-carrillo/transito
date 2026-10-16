export interface RegistrationFields {
  first_name: string;
  last_name: string;
  cedula: string;
  phone: string;
  email: string;
}

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateProfileFields(
  f: RegistrationFields,
): FieldErrors<keyof RegistrationFields> {
  const errors: FieldErrors<keyof RegistrationFields> = {};
  if (!f.first_name.trim()) errors.first_name = "Escribe tu nombre.";
  if (!f.last_name.trim()) errors.last_name = "Escribe tu apellido.";
  if (!/^[0-9A-Za-z.-]{5,20}$/.test(f.cedula.trim()))
    errors.cedula = "Cédula inválida (solo números, letras, puntos o guiones).";
  if (f.phone.replace(/\D/g, "").length < 7) errors.phone = "Teléfono inválido.";
  if (!EMAIL_RE.test(f.email.trim())) errors.email = "Correo inválido.";
  return errors;
}

export function validatePasswords(
  password: string,
  confirm: string,
  { required }: { required: boolean },
): FieldErrors<"password" | "confirm"> {
  if (!required && !password && !confirm) return {};
  const errors: FieldErrors<"password" | "confirm"> = {};
  if (password.length < 6) errors.password = "Mínimo 6 caracteres.";
  if (confirm !== password) errors.confirm = "Las contraseñas no coinciden.";
  return errors;
}
