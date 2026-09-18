import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { useAuth } from "../../context/AuthContext";
import { canAccessCustomerPages } from "../../lib/roles";

export function Layout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">{children}</main>
      {!loading && canAccessCustomerPages(user) && <Footer />}
    </div>
  );
}
