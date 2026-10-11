import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export function Delivery() {
  return (
    <div className="delivery-page">
      <section className="delivery-landing-hero" aria-labelledby="delivery-page-title">
        <div className="delivery-landing-hero__content">
          <p className="delivery-kicker">Delivery from Capitol</p>
          <h1 id="delivery-page-title">Capitol at your door.</h1>
          <p className="delivery-landing-hero__intro">
            Packed meals and Capitol favorites, delivered from our kitchen in Pasay City.
          </p>
          <div className="delivery-landing-hero__actions">
            <Link className="button button--red delivery-primary-cta" to="/delivery/order">
              <ShoppingBag size={17} /> Start an order <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="delivery-landing-hero__visual">
          <img
            src="/delivery/delivery-hero.jpeg"
            alt="Capitol Crispy Ulo and Yangchow Rice in Capitol packaging"
          />
        </div>
      </section>

      <section className="delivery-areas" aria-labelledby="delivery-areas-title">
        <div className="delivery-areas__inner">
          <div>
            <p className="delivery-kicker">Where we deliver</p>
            <h2 id="delivery-areas-title" className="delivery-section-title">
              Pasay at the core, within a 5-km radius.
            </h2>
          </div>
          <div className="delivery-areas__body">
            <p>
              Our Arnaiz, Pasay kitchen delivers across Pasay City, and also serves
              nearby areas of Manila, Makati, and Parañaque. Deliveries are limited
              to addresses within a 5-kilometer radius, so your food arrives fresh
              and on time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
