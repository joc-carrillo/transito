import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppShell } from "@/components/auth/AppShell";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tránsito · Control de acceso",
  description: "Control de tránsito y acceso vehicular con códigos QR",
  appleWebApp: {
    capable: true,
    title: "Tránsito",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f3f1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {!isSupabaseConfigured() && (
          <div className="bg-ink px-5 py-3 text-center text-sm font-medium text-white">
            Supabase no está configurado: completa{" "}
            <code className="rounded bg-white/15 px-1.5 py-0.5">.env.local</code>{" "}
            y reinicia el servidor.
          </div>
        )}
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
