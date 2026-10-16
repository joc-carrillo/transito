import type { Metadata } from "next";
import { ProfileView } from "@/components/auth/ProfileView";

export const metadata: Metadata = { title: "Editar perfil · Tránsito" };

export default function PerfilPage() {
  return <ProfileView />;
}
