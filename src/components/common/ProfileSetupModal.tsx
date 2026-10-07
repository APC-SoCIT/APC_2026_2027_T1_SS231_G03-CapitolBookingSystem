import { UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchStoredProfile,
  saveProfileRemote,
} from "../../lib/contact";

/** Full-name: letters, spaces, dots, hyphens, apostrophes; 3–60 chars. */
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s.'-]{3,60}$/;
/** Philippine mobile number: 11 digits, starting with 09 (spaces/dashes ignored). */
const PH_MOBILE_PATTERN = /^09\d{9}$/;

/**
 * One-time profile setup for new customers. Required: the modal has no
 * dismiss affordance and only closes after the server confirms the save,
 * so details are entered once and reused across delivery, catering, and
 * function room forms.
 */
export function ProfileSetupModal() {
  const { user, refreshProfile } = useAuth();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressNote, setAddressNote] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Prefill from the auth session + server profile before showing the form,
  // so Google signups start with their account name already filled in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setName(user.displayName === "Customer" ? "" : user.displayName);
    void fetchStoredProfile(user.id).then((server) => {
      if (cancelled) return;
      if (server.phone) setPhone(server.phone);
      const first = server.addresses.find((entry) => entry.address);
      if (first) {
        setAddress(first.address);
        if (first.label) setAddressLabel(first.label);
        if (first.note) setAddressNote(first.note);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof fieldErrors = {};
    if (!NAME_REGEX.test(name.trim())) {
      nextErrors.name = "Letters only, min. 3 characters (e.g. Juan dela Cruz)";
    }
    if (!PH_MOBILE_PATTERN.test(phone.replace(/\D/g, ""))) {
      nextErrors.phone = "Enter an 11-digit number starting with 09";
    }
    if (!address.trim()) {
      nextErrors.address = "Delivery address is required";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError("");
    const saveError = await saveProfileRemote(user.id, {
      displayName: name.trim(),
      phone: phone.trim(),
      addresses: [
        {
          label: addressLabel.trim() || "Home",
          address: address.trim(),
          note: addressNote.trim(),
        },
      ],
      onboardingCompleted: true,
    });
    if (saveError) {
      // Values stay in the form so nothing is lost; retry keeps them.
      setError(saveError);
      setSaving(false);
      return;
    }
    setSaved(true);
    try {
      await refreshProfile();
    } catch {
      setError("Profile saved, but the page did not refresh. Press Continue to proceed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="signin-backdrop">
      <div
        className="signin-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Complete your profile"
      >
        <div className="signin-modal__header">
          <div className="signin-modal__header-icon">
            <UserRound size={22} />
          </div>
          <div>
            <p className="eyebrow">Capitol Restaurant</p>
            <h2>Complete your profile</h2>
          </div>
        </div>

        {!ready ? (
          <p className="auth-loading">Loading your details…</p>
        ) : (
          <form className="signin-modal__body" onSubmit={handleSubmit}>
            <p className="signin-message" role="status">
              One-time setup. Your details are saved and reused on every order
              form — you can change them later on your profile page.
            </p>

            <div className="signin-field">
              <label htmlFor="setup-name">Full name</label>
              <input
                id="setup-name"
                className={`input ${fieldErrors.name ? "input--error" : ""}`}
                type="text"
                placeholder="Juan dela Cruz"
                value={name}
                disabled={saving || saved}
                autoComplete="name"
                onChange={(event) => {
                  setName(event.target.value);
                  setFieldErrors((current) => ({ ...current, name: undefined }));
                }}
              />
              {fieldErrors.name && (
                <p className="signin-error" role="alert">{fieldErrors.name}</p>
              )}
            </div>

            <div className="signin-field">
              <label htmlFor="setup-email">Email address</label>
              <input
                id="setup-email"
                className="input"
                type="email"
                value={user.email}
                disabled
                autoComplete="email"
              />
            </div>

            <div className="signin-field">
              <label htmlFor="setup-phone">Contact number</label>
              <input
                id="setup-phone"
                className={`input ${fieldErrors.phone ? "input--error" : ""}`}
                type="tel"
                placeholder="09XX XXX XXXX"
                value={phone}
                disabled={saving || saved}
                autoComplete="tel"
                onChange={(event) => {
                  setPhone(event.target.value);
                  setFieldErrors((current) => ({ ...current, phone: undefined }));
                }}
              />
              {fieldErrors.phone && (
                <p className="signin-error" role="alert">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="signin-field">
              <label htmlFor="setup-address">Delivery address</label>
              <textarea
                id="setup-address"
                className={`input ${fieldErrors.address ? "input--error" : ""}`}
                placeholder="House number, street, barangay, city"
                rows={3}
                value={address}
                disabled={saving || saved}
                autoComplete="street-address"
                onChange={(event) => {
                  setAddress(event.target.value);
                  setFieldErrors((current) => ({ ...current, address: undefined }));
                }}
              />
              {fieldErrors.address && (
                <p className="signin-error" role="alert">{fieldErrors.address}</p>
              )}
            </div>

            {error && (
              <p className="signin-error" role="alert">{error}</p>
            )}

            <button
              className="button button--red signin-submit"
              type="submit"
              disabled={saving || saved}
              aria-busy={saving}
            >
              {saving ? "Saving…" : saved ? "Saved" : "Save and continue"}
            </button>

            {saved && error && (
              <button
                className="button button--outline-dark signin-submit"
                type="button"
                onClick={() => void refreshProfile().catch(() => undefined)}
              >
                Continue
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
