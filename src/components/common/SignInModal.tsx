import { Eye, EyeOff, LogIn, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";

interface SignInModalProps {
  onClose: () => void;
  onSuccess: (role: "admin" | "customer") => void;
}

export function SignInModal({ onClose, onSuccess }: SignInModalProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    // Simulate a brief loading state for polish
    setTimeout(() => {
      const result = login(username.trim(), password);

      if (result.success) {
        // Determine which account just logged in
        const role = username.trim().toLowerCase() === "admin" ? "admin" : "customer";
        onSuccess(role);
      } else {
        setError(result.error || "Login failed");
        setIsLoading(false);
      }
    }, 600);
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
            <label htmlFor="signin-username">Username / Email</label>
            <input
              id="signin-username"
              className={`input ${error ? "input--error" : ""}`}
              type="text"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="signin-field">
            <label htmlFor="signin-password">Password</label>
            <div className="signin-password-wrap">
              <input
                id="signin-password"
                className={`input ${error ? "input--error" : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="current-password"
              />
              <button
                className="signin-password-toggle"
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="signin-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="button button--red signin-submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="signin-spinner" />
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
