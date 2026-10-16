import type { Metadata } from "next";
import { ReportsView } from "@/components/informes/ReportsView";

export const metadata: Metadata = { title: "Informes · Tránsito" };

export default function InformesPage() {
  return <ReportsView />;
}
