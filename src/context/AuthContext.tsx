import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

import { isUserRole, type UserRole } from "../lib/roles";

export interface User {
  id: string;
  email: string;
  role: UserRole | null;
  displayName: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  role?: UserRole | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sendMagicLink: (email: string) => Promise<AuthActionResult>;
  signInWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  signInWithGoogle: () => Promise<AuthActionResult>;
  logout: () => Promise<AuthActionResult>;
}

const AuthContext = createContext<AuthContextType | null>(null);

type Profile = {
  display_name: string | null;
  role: unknown;
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
  let profile: Profile | null = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", authUser.id)
      .maybeSingle<Profile>();
    if (error) throw error;
    profile = data;
  } catch {
    console.warn("Unable to load user profile");
  }

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    role: isUserRole(profile?.role) ? profile.role : null,
    displayName: profile?.display_name || getMetadataName(authUser),
  };
}

function authRedirectUrl() {
  const currentRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return new URL(currentRoute || "/", window.location.origin).toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let syncVersion = 0;
    let accountId: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const version = ++syncVersion;
      clearTimeout(timer);
      const authUser = session?.user ?? null;
      if (!authUser) {
        accountId = null;
        setUser(null);
        setLoading(false);
        return;
      }
      if (accountId !== authUser.id) {
        accountId = authUser.id;
        setUser(null);
        setLoading(true);
      }
      timer = setTimeout(() => {
        void toAppUser(authUser).then((nextUser) => {
          if (mounted && version === syncVersion) {
            setUser((current) =>
              current?.id === nextUser.id && current.email === nextUser.email &&
              current.role === nextUser.role && current.displayName === nextUser.displayName
                ? current
                : nextUser,
            );
            setLoading(false);
          }
        });
      }, 0);
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
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

  const signInWithPassword = async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };

      if (!data.user) return { success: false, error: "Unable to load account" };
      const appUser = await toAppUser(data.user);
      return { success: true, role: appUser.role };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to log in",
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
        signInWithPassword,
        signInWithGoogle,
        logout,
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
