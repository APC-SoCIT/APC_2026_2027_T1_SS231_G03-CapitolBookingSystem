import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  { label: 'Catering', title: 'Catering', text: "Bring Capitol's authentic flavors to your event with buffet packages or individually packed meals.", path: '/catering' },
  { label: 'Events', title: 'Function Rooms', text: 'Host celebrations in our elegant function rooms, from corporate events to family gatherings.', path: '/function-rooms' },
  { label: 'Delivery', title: 'Delivery', text: "Enjoy Capitol's home-cooked favorites delivered straight to your door in select areas.", path: '/delivery' },
];

export function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-orbit hero-orbit--top" />
        <div className="hero-orbit hero-orbit--bottom" />
        <div className="hero-content">
          <p className="hero-tag">Est. 1940 · Pasay City, Metro Manila</p>
          <h1>Capitol</h1>
          <p className="hero-subtitle">Pasay City&apos;s Oldest Restaurant</p>
          <div className="ornament-divider"><span>◆</span></div>
          <p className="hero-intro">For over eight decades, Capitol has been at the heart of Pasay City — bringing families, friends, and communities together through the warmth of authentic Filipino cuisine.</p>
          <div className="hero-actions">
            <Link className="button button--gold" to="/catering">Book Catering</Link>
            <Link className="button button--outline" to="/function-rooms">Reserve a Room</Link>
          </div>
        </div>
      </section>

      <section className="section section--services">
        <div className="section-heading">
          <p className="eyebrow">What We Offer</p>
          <h2>Our Services</h2>
          <p>From intimate gatherings to grand celebrations — Capitol has a service for every occasion.</p>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <Link className="service-card" key={service.path} to={service.path}>
              <span className="service-card__label">{service.label}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <span className="service-card__action">Learn more <ArrowRight size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="legacy-strip">
        <div className="legacy-strip__content">
          <span className="legacy-mark">◆</span>
          <h2>A Legacy Since 1940</h2>
          <p>Capitol Restaurant has been a Pasay City institution for over 80 years. Generations of families have celebrated life&apos;s most important moments with us.</p>
        </div>
      </section>
    </div>
  );
}
