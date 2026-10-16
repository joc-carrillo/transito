import type { Metadata } from "next";
import { AffiliatesView } from "@/components/afiliados/AffiliatesView";

export const metadata: Metadata = { title: "Afiliados · Tránsito" };

export default function AfiliadosPage() {
  return <AffiliatesView />;
}
