import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getSupabaseSession,
  persistSupabaseSession,
  signOut as supabaseSignOut,
  Session,
  supabase
} from "@/lib/supabaseAuth";

interface AuthCtx {
  session: Session | null;
  user: Session["user"] | null;
  loading: boolean;
  signOut: () => void;
  refreshSession: () => void;
}

const Ctx = createContext<AuthCtx>({ 
  session: null, 
  user: null,
  loading: true, 
  signOut: () => {},
  refreshSession: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getSupabaseSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, authSession) => {
      const next = persistSupabaseSession(authSession);
      setSession(next);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = () => {
    supabaseSignOut();
    setSession(null);
    window.location.reload();
  };

  const refreshSession = () => {
    getSupabaseSession().then(setSession);
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, signOut: handleSignOut, refreshSession }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
