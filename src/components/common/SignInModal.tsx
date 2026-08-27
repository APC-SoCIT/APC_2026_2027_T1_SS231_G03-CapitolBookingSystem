import { Chrome, LogIn, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";

interface SignInModalProps {
  onClose: () => void;
}

export function SignInModal({ onClose }: SignInModalProps) {
  const { sendMagicLink, signInWithPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"signin" | "login">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your email address");
      return;
    }

    setIsEmailLoading(true);
    const result = await sendMagicLink(normalizedEmail);
    if (result.success) {
      setMessage("Magic link sent. Check your inbox to finish signing in.");
    } else {
      setError(result.error || "Unable to send magic link");
    }
    setIsEmailLoading(false);
  };

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your email address");
      return;
    }
    if (!password) {
      setError("Enter your password");
      return;
    }

    setIsPasswordLoading(true);
    const result = await signInWithPassword(normalizedEmail, password);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Invalid email or password");
    }
    setIsPasswordLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setMessage("");
    setIsGoogleLoading(true);

    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error || "Unable to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  const switchMode = (next: "signin" | "login") => {
    setMode(next);
    setError("");
    setMessage("");
  };

  return (
    <div className="signin-backdrop" onClick={onClose}>
      <div
        className="signin-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sign In"
      >
        <button
          className="signin-modal__close"
          onClick={onClose}
          type="button"
          aria-label="Close sign in dialog"
        >
          <X size={18} />
        </button>

        <div className="signin-modal__header">
          <div className="signin-modal__header-icon">
            <LogIn size={22} />
          </div>
          <div>
            <p className="eyebrow">Capitol Restaurant</p>
            <h2>{mode === "signin" ? "Sign In" : "Log In"}</h2>
          </div>
        </div>

        <div className="signin-tabs" role="tablist" aria-label="Sign in or log in">
          <button
            className={`signin-tab ${mode === "signin" ? "signin-tab--active" : ""}`}
            onClick={() => switchMode("signin")}
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
          >
            Sign In
          </button>
          <button
            className={`signin-tab ${mode === "login" ? "signin-tab--active" : ""}`}
            onClick={() => switchMode("login")}
            type="button"
            role="tab"
            aria-selected={mode === "login"}
          >
            Log In
          </button>
        </div>

        {mode === "signin" ? (
          <form className="signin-modal__body" onSubmit={handleMagicLink}>
            <div className="signin-field">
              <label htmlFor="signin-email">Email address</label>
              <input
                id="signin-email"
                className={`input ${error ? "input--error" : ""}`}
                type="email"
                placeholder="you@example.com"
                value={email}
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setMessage("");
                }}
                autoFocus
                autoComplete="email"
              />
            </div>

            {error && (
              <p className="signin-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="signin-message" role="status" aria-live="polite">
                {message}
              </p>
            )}

            <button
              className="button button--red signin-submit"
              type="submit"
              disabled={isEmailLoading || isGoogleLoading}
              aria-busy={isEmailLoading}
            >
              {isEmailLoading ? (
                <span className="signin-spinner" />
              ) : (
                <>
                  <LogIn size={16} />
                  Email me a magic link
                </>
              )}
            </button>

            <div className="signin-divider" aria-hidden="true">
              <span>or</span>
            </div>

            <button
              className="button button--outline-dark signin-google"
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={isEmailLoading || isGoogleLoading}
              aria-busy={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <span className="signin-spinner signin-spinner--dark" />
              ) : (
                <Chrome size={16} />
              )}
              Continue with Google
            </button>
          </form>
        ) : (
          <form className="signin-modal__body" onSubmit={handlePasswordLogin}>
            <div className="signin-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                className={`input ${error ? "input--error" : ""}`}
                type="email"
                placeholder="admin@capitol.com"
                value={email}
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setMessage("");
                }}
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="signin-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className={`input ${error ? "input--error" : ""}`}
                type="password"
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                  setMessage("");
                }}
                autoComplete="current-password"
              />
              <small className="signin-hint">Demo: admin@capitol.com / 123456</small>
            </div>

            {error && (
              <p className="signin-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="signin-message" role="status" aria-live="polite">
                {message}
              </p>
            )}

            <button
              className="button button--red signin-submit"
              type="submit"
              disabled={isPasswordLoading}
              aria-busy={isPasswordLoading}
            >
              {isPasswordLoading ? (
                <span className="signin-spinner" />
              ) : (
                <>
                  <LogIn size={16} />
                  Log In
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
