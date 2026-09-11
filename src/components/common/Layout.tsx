import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { useAuth } from "../../context/AuthContext";

export function Layout({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">{children}</main>
      {/* Admin pages are tool-only — the customer footer has no place there.
          Hidden while loading too, so admins don't see it flash. */}
      {!loading && !isAdmin && <Footer />}
    </div>
  );
}
