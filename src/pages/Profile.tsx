import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../lib/roles";
import { BookingHistory } from "../components/profile/BookingHistory";
import { SignInModal } from "../components/common";
import {
  getStoredProfile,
  saveStoredProfile,
  type StoredAddress,
} from "../lib/contact";

// Philippine mobile number: 11 digits, starting with 09 (spaces/dashes ignored).
const PH_MOBILE_PATTERN = /^09\d{9}$/;

const EMPTY_ADDRESS: StoredAddress = { label: "", address: "", note: "" };

function defaultAddresses(stored: StoredAddress[]): StoredAddress[] {
  return [stored[0] ?? { ...EMPTY_ADDRESS }, stored[1] ?? { ...EMPTY_ADDRESS }];
}

export function Profile() {
  const { user, loading } = useAuth();
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<StoredAddress[]>([
    { ...EMPTY_ADDRESS },
    { ...EMPTY_ADDRESS },
  ]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (!user) return;
    const stored = getStoredProfile(user.id);
    setPhone(stored.phone);
    setAddresses(defaultAddresses(stored.addresses));
    setError("");
    setSaved(false);
  }, [user]);

  if (loading) return <div className="auth-loading">Loading account...</div>;

  if (!user) {
    return (
      <div className="placeholder-page">
        <h1>Profile</h1>
        <p>Sign in to view and manage your profile details.</p>
        <button
          className="button button--red"
          onClick={() => setShowSignIn(true)}
          type="button"
        >
          Sign In / Log In
        </button>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      </div>
    );
  }

  const updateAddress = (
    index: number,
    key: keyof StoredAddress,
    value: string,
  ) => {
    setAddresses((current) =>
      current.map((entry, i) =>
        i === index ? { ...entry, [key]: value } : entry,
      ),
    );
    setError("");
    setSaved(false);
  };

  const saveProfile = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits && !PH_MOBILE_PATTERN.test(digits)) {
      setError("Enter an 11-digit number starting with 09");
      setSaved(false);
      return;
    }
    saveStoredProfile(user.id, {
      phone: phone.trim(),
      addresses: addresses
        .map((entry) => ({
          label: entry.label.trim(),
          address: entry.address.trim(),
          note: entry.note.trim(),
        }))
        .filter((entry) => entry.label || entry.address || entry.note),
    });
    setError("");
    setSaved(true);
  };

  return (
    <div className="inquiries-page">
      <section className="section profile-layout">
        <div className="profile-side">
          <div className="inquiry-form profile-account-card">
            <p className="eyebrow">Account</p>
            <h2>{user.displayName}</h2>
            <span className="profile-role-badge">
              {user.role ? ROLE_LABELS[user.role] : "Customer"}
            </span>
            <dl className="profile-account-meta">
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              {phone.trim() !== "" && (
                <div>
                  <dt>Phone</dt>
                  <dd>{phone}</dd>
                </div>
              )}
            </dl>
            <p className="profile-account-note">
              Reservations and orders made with this account show up in your
              booking history automatically.
            </p>
          </div>

          <div className="inquiry-form profile-bookings-card">
            <h2>My bookings</h2>
            <BookingHistory userId={user.id} />
          </div>
        </div>

        <div className="inquiry-form">
          <h2>Contact details</h2>

          <label className="form-field">
            <span>Full Name</span>
            <input
              className="input"
              value={user.displayName}
              disabled
              readOnly
              autoComplete="name"
            />
          </label>

          <label className="form-field">
            <span>Email Address</span>
            <input
              className="input"
              value={user.email}
              disabled
              readOnly
              autoComplete="email"
            />
          </label>

          <label className="form-field">
            <span>Phone Number</span>
            <input
              className="input"
              placeholder="09XX XXX XXXX"
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setError("");
                setSaved(false);
              }}
              autoComplete="tel"
            />
          </label>

          {addresses.map((entry, index) => (
            <div key={index} className="profile-address-block">
              <p className="eyebrow">Address {index + 1}</p>

              <label className="form-field">
                <span>Label</span>
                <input
                  className="input"
                  placeholder={index === 0 ? "Home" : "Office"}
                  value={entry.label}
                  onChange={(event) =>
                    updateAddress(index, "label", event.target.value)
                  }
                />
              </label>

              <label className="form-field">
                <span>Address</span>
                <textarea
                  className="input"
                  placeholder="Street, barangay, city"
                  rows={3}
                  value={entry.address}
                  onChange={(event) =>
                    updateAddress(index, "address", event.target.value)
                  }
                  autoComplete="street-address"
                />
              </label>

              <label className="form-field">
                <span>Note</span>
                <input
                  className="input"
                  placeholder="Gate code, landmark, delivery instructions"
                  value={entry.note}
                  onChange={(event) =>
                    updateAddress(index, "note", event.target.value)
                  }
                />
              </label>
            </div>
          ))}

          {error && (
            <p className="signin-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="button button--red"
            onClick={saveProfile}
            type="button"
          >
            Save Profile
          </button>

          {saved && (
            <div className="success-message">
              <strong>Profile saved.</strong>
              <span>
                Your details will be prefilled on delivery and reservation
                forms.
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
