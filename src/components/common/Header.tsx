import { LogIn, LogOut, Menu, ShieldCheck, TriangleAlert, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { NAVIGATION_ITEMS, RESTAURANT_INFO } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { SignInModal } from "./SignInModal";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, loading, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock scroll when modal is open
  useEffect(() => {
    if (showSignIn || showLogoutConfirm) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [showSignIn, showLogoutConfirm]);

  const handleLogout = async () => {
    setLogoutError("");
    setIsLoggingOut(true);
    const result = await logout();
    if (result.success) {
      setShowLogoutConfirm(false);
      navigate("/");
    } else {
      setLogoutError(result.error || "Unable to sign out");
    }
    setIsLoggingOut(false);
  };

  return (
    <>
      <header
        className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}
      >
        <div className="site-header__inner">
          <Link className="brand" to="/" aria-label="Capitol Restaurant home">
            <span className="brand__name">{RESTAURANT_INFO.name}</span>
            <span className="brand__meta">
              Since {RESTAURANT_INFO.since} · Pasay City
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {NAVIGATION_ITEMS.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link--active" : ""}`
                }
                key={item.path}
                to={item.path}
              >
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                className={({ isActive }) =>
                  `nav-link nav-link--dashboard ${isActive ? "nav-link--active" : ""}`
                }
                to="/operations"
              >
                Operations
              </NavLink>
            )}
          </nav>

          {/* Right side: Sign In / User badge */}
          <div className="header-auth">
            {loading ? null : user ? (
              <div className="auth-user-badge">
                <span className="auth-user-avatar">
                  {isAdmin ? <ShieldCheck size={14} /> : <User size={14} />}
                </span>
                <span className="auth-user-info">
                  <strong>{user.displayName}</strong>
                  <small>{isAdmin ? "Administrator" : "Customer"}</small>
                </span>
                <button
                  className="auth-logout-btn"
                  onClick={() => {
                    setLogoutError("");
                    setShowLogoutConfirm(true);
                  }}
                  type="button"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                className="auth-signin-btn"
                onClick={() => setShowSignIn(true)}
                type="button"
              >
                <LogIn size={15} />
                Sign In / Log In
              </button>
            )}
          </div>

          <button
            aria-expanded={menuOpen}
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {NAVIGATION_ITEMS.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `mobile-nav__link ${isActive ? "mobile-nav__link--active" : ""}`
                }
                key={item.path}
                to={item.path}
              >
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                className={({ isActive }) =>
                  `mobile-nav__link ${isActive ? "mobile-nav__link--active" : ""}`
                }
                to="/operations"
              >
                Operations
              </NavLink>
            )}
          </nav>
        )}
      </header>

      {showSignIn && (
        <SignInModal onClose={() => setShowSignIn(false)} />
      )}

      {showLogoutConfirm && (
        <div className="signin-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div
            className="logout-confirm"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm sign out"
          >
            <div className="logout-confirm__icon">
              <TriangleAlert size={28} />
            </div>
            <h3>Are you sure?</h3>
            <p>You will be signed out and redirected to the homepage.</p>
            {logoutError && (
              <p className="signin-error" role="alert">
                {logoutError}
              </p>
            )}
            <div className="logout-confirm__actions">
              <button
                className="button button--outline-dark logout-confirm__cancel"
                onClick={() => setShowLogoutConfirm(false)}
                type="button"
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                className="button button--red logout-confirm__yes"
                onClick={handleLogout}
                type="button"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="signin-spinner" />
                ) : (
                  <LogOut size={15} />
                )}
                {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
