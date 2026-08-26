import { Chrome, LogIn, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";

interface SignInModalProps {
  onClose: () => void;
}

export function SignInModal({ onClose }: SignInModalProps) {
  const { sendMagicLink, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
            <h2>Sign In</h2>
          </div>
        </div>

        <form className="signin-modal__body" onSubmit={handleSubmit}>
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
      </div>
    </div>
  );
}
