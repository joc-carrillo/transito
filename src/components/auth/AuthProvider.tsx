"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { getMyProfile } from "@/lib/supabase/profile";
import { ProfilePhotoStep } from "./ProfilePhotoStep";
import type { Profile } from "@/types/database";

const PUBLIC_ROUTES = ["/login"];

type SessionState =
  | { status: "loading"; session: null }
  | { status: "signed_out"; session: null }
  | { status: "signed_in"; session: Session };

type AuthContextValue = SessionState & {
  /** `undefined` mientras se carga; `null` si el usuario aún no tiene fila de perfil. */
  profile: Profile | null | undefined;
  setProfile: (profile: Profile) => void;
};

const AuthContext = createContext<AuthContextValue>({
  status: "loading",
  session: null,
  profile: undefined,
  setProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

function Spinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <span className="size-10 animate-spin rounded-full border-4 border-soft border-t-ink" />
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<SessionState>({ status: "loading", session: null });
  const [loaded, setLoaded] = useState<{ userId: string; profile: Profile | null } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const userId = auth.session?.user.id;

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    const apply = (session: Session | null) =>
      setAuth(
        session
          ? { status: "signed_in", session }
          : { status: "signed_out", session: null },
      );

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getMyProfile(userId)
      .then((profile) => active && setLoaded({ userId, profile }))
      .catch(() => active && setLoaded({ userId, profile: null }));
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (auth.status === "signed_out" && !isPublic) router.replace("/login");
    if (auth.status === "signed_in" && isPublic) router.replace("/");
  }, [auth.status, isPublic, router]);

  const profile = loaded && loaded.userId === userId ? loaded.profile : undefined;
  const setProfile = useCallback(
    (next: Profile) => setLoaded({ userId: next.id, profile: next }),
    [],
  );

  let content: React.ReactNode = <Spinner />;
  if (!isSupabaseConfigured()) content = children;
  if (auth.status === "signed_out" && isPublic) content = children;
  if (auth.status === "signed_in" && !isPublic && profile !== undefined) {
    content = profile?.photo_url ? children : <ProfilePhotoStep />;
  }

  return (
    <AuthContext.Provider value={{ ...auth, profile, setProfile }}>
      {content}
    </AuthContext.Provider>
  );
}
