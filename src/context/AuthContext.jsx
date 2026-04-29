import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear old mock data if it exists
    localStorage.removeItem('mock_user');
    
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signIn: async ({ email, password }) => {
        // Try real Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("Auth failed:", error.message);
        }
        return { data, error };
      },
      signUp: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          console.error("Sign up failed:", error.message);
        }
        return { data, error };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        return { error: null };
      },
      sendPasswordReset: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return { error };
      },
      updatePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error };
      },
    }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
