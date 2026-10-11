import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const branches = [
  "Arnaiz, Pasay",
  "Malibay, Pasay",
  "Edison, Makati",
  "Harlem Restaurant",
];

export function About() {
  return (
    <div className="about-page">
      <section className="page-hero">
        <p className="eyebrow">Capitol Restaurant · Est. 1940</p>
        <h1>About Capitol</h1>
        <p>
          Filipino-Chinese cooking, served under one roof in Pasay City for over
          85 years.
        </p>
      </section>

      <section className="section about-section">
        <div className="about-content">
          <div className="about-content__visual">
            <img
              src="/delivery/delivery-hero-2.jpg"
              alt="Diners gathered over Filipino-Chinese dishes at Capitol Restaurant"
            />
          </div>
          <div className="about-content__copy">
            <p className="eyebrow">Our Story</p>
            <h2>About Capitol Restaurant</h2>
            <p>
              Since 1940, Capitol Restaurant has served Pasay City, bringing
              Filipino and Chinese cooking together under one roof. For over 85
              years, the restaurant has been a fixture of its neighborhood, and
              it is led today by President Wynmar Sy.
            </p>
            <p>
              As one of the earliest restaurants in the city to serve
              Filipino-Chinese cuisine, Capitol has grown alongside its regular
              customers. The restaurant is best known for its Crispy Ulo, a
              crispy roasted pig&apos;s head, and its specialties Adobong Kabayo
              and Tapang Kabayo.
            </p>
            <p>
              Open everyday from 8:00 AM to 2:00 AM, Capitol is ready for your
              breakfast, lunch, dinner, and late-night cravings.
            </p>
            <p className="about-note">
              Orders placed through this website are currently handled only by
              the Arnaiz, Pasay branch.
            </p>
          </div>
        </div>
      </section>

      <section className="section about-branches-section">
        <div className="section-heading">
          <h2>Our Branches</h2>
          <p>Four kitchens serving Pasay City and beyond, since 1940.</p>
        </div>
        <div className="about-branch-grid">
          {branches.map((branch) => (
            <article className="branch-card" key={branch}>
              <h3>{branch}</h3>
              <small>Dine-in · Take-out{branch.includes("Arnaiz") ? " · Delivery" : ""}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="about-contact">
        <div className="about-contact__content">
          <span className="legacy-mark">◆</span>
          <h2>Contact</h2>
          <div className="about-contact__numbers">
            <div className="about-contact__number">
              <small>Deliveries</small>
              <strong>8-822-5572</strong>
            </div>
            <span className="about-contact__divider" />
            <div className="about-contact__number">
              <small>Inquiries</small>
              <strong>0917 514 1300</strong>
            </div>
          </div>
          <div className="about-contact__actions">
            <Link className="about-contact__cta" to="/delivery">
              <ShoppingBag size={15} /> View delivery areas &amp; order{" "}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
