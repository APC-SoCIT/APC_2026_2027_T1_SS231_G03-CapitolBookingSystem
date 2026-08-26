import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export type UserRole = "admin" | "customer";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sendMagicLink: (email: string) => Promise<AuthActionResult>;
  signInWithGoogle: () => Promise<AuthActionResult>;
  logout: () => Promise<AuthActionResult>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

type Profile = {
  display_name: string;
  role: UserRole;
};

function getMetadataName(authUser: SupabaseUser) {
  const metadata = authUser.user_metadata as Record<string, unknown>;
  const metadataName = metadata.full_name ?? metadata.name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  return authUser.email?.split("@")[0] || "Customer";
}

async function toAppUser(authUser: SupabaseUser): Promise<User> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", authUser.id)
    .maybeSingle<Profile>();

  if (error) {
    console.warn("Unable to load user profile", error.message);
  }

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    role: profile?.role === "admin" ? "admin" : "customer",
    displayName: profile?.display_name || getMetadataName(authUser),
  };
}

function authRedirectUrl() {
  return new URL("/dashboard", window.location.origin).toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let syncVersion = 0;

    const syncUser = async (authUser: SupabaseUser | null) => {
      const version = ++syncVersion;

      if (!authUser) {
        if (mounted && version === syncVersion) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const nextUser = await toAppUser(authUser);
      if (mounted && version === syncVersion) {
        setUser(nextUser);
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setLoading(true);
      void syncUser(session?.user ?? null);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.warn("Unable to restore auth session", error.message);
      return syncUser(data.session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = async (email: string): Promise<AuthActionResult> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: authRedirectUrl(),
          shouldCreateUser: true,
        },
      });

      return error ? { success: false, error: error.message } : { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to send magic link",
      };
    }
  };

  const signInWithGoogle = async (): Promise<AuthActionResult> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authRedirectUrl() },
      });

      return error ? { success: false, error: error.message } : { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to sign in with Google",
      };
    }
  };

  const logout = async (): Promise<AuthActionResult> => {
    try {
      const { error } = await supabase.auth.signOut();
      return error ? { success: false, error: error.message } : { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to sign out",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sendMagicLink,
        signInWithGoogle,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
