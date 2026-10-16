import type { Metadata } from "next";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";

export const metadata: Metadata = { title: "Estado · Tránsito" };

export default function HomePage() {
  return <KanbanBoard />;
}
