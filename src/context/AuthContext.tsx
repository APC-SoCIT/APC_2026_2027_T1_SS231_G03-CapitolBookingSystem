import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UserRole = "admin" | "customer";

export interface User {
  username: string;
  role: UserRole;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAdmin: boolean;
}

const ACCOUNTS: { username: string; password: string; role: UserRole; displayName: string }[] = [
  { username: "admin", password: "1234", role: "admin", displayName: "Admin" },
  { username: "johnmarston@email.com", password: "1234", role: "customer", displayName: "John Marston" },
];

const AUTH_STORAGE_KEY = "capitol_auth_user";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = (username: string, password: string) => {
    const account = ACCOUNTS.find(
      (a) => a.username.toLowerCase() === username.toLowerCase() && a.password === password,
    );

    if (!account) {
      return { success: false, error: "Invalid username or password" };
    }

    setUser({ username: account.username, role: account.role, displayName: account.displayName });
    return { success: true };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
