import { useAuth } from "../context/AuthContext";

export function DeliveryRider() {
  const { user } = useAuth();

  return (
    <section className="placeholder-page" aria-labelledby="rider-heading">
      <p className="eyebrow">Delivery Rider</p>
      <h1 id="rider-heading">My deliveries</h1>
      <p>Welcome, {user?.displayName}.</p>
      <p>Delivery assignments and status updates are coming soon.</p>
    </section>
  );
}
