"use client";

import { BottomNav } from "@/components/ui/BottomNav";
import { useAuth } from "./AuthProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status !== "signed_in") return <main className="min-h-dvh">{children}</main>;

  return (
    <>
      <main className="min-h-dvh pb-[calc(var(--safe-bottom)+7.5rem)] lg:pb-16 lg:pl-36">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
