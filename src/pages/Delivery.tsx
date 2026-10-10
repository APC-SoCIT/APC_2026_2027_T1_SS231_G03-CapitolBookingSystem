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
    </div>
  );
}
