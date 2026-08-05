import { Link } from 'react-router-dom';
import { NAVIGATION_ITEMS, RESTAURANT_INFO } from '../../constants';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__ornament" />
      <div className="site-footer__grid">
        <section>
          <h2 className="footer-brand">{RESTAURANT_INFO.name}</h2>
          <p className="footer-since">Since {RESTAURANT_INFO.since}</p>
          <p className="footer-copy">
            {RESTAURANT_INFO.tagline}.<br />
            Serving Pasay City with pride since {RESTAURANT_INFO.since}.
          </p>
        </section>

        <section>
          <h3 className="footer-heading">Services</h3>
          <nav className="footer-links" aria-label="Footer services">
            {NAVIGATION_ITEMS.map((item) => <Link key={item.path} to={item.path}>{item.label}</Link>)}
          </nav>
        </section>

        <section>
          <h3 className="footer-heading">Contact</h3>
          <div className="footer-links">
            <span>{RESTAURANT_INFO.address}</span>
            <a href={`tel:${RESTAURANT_INFO.phone}`}>{RESTAURANT_INFO.phone}</a>
            <a href={`mailto:${RESTAURANT_INFO.email}`}>{RESTAURANT_INFO.email}</a>
          </div>
          <div className="footer-socials">
            <a href="#" aria-label="Capitol on Facebook">Facebook</a>
            <a href="#" aria-label="Capitol on Instagram">Instagram</a>
          </div>
        </section>
      </div>
      <div className="site-footer__bottom">© {new Date().getFullYear()} Capitol Restaurant · Pasay City, Metro Manila</div>
    </footer>
  );
}
