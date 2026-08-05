import { ArrowRight, Utensils, UtensilsCrossed } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Catering() {
  return <div>
    <section className="page-hero"><p className="eyebrow">Capitol Restaurant</p><h1>Catering Services</h1><p>Let Capitol bring our legacy to your celebration. Choose the catering style that suits your event.</p></section>
    <section className="section catering-choice">
      <h2>How would you like your catering?</h2>
      <div className="choice-grid">
        <ChoiceCard icon={<Utensils size={24} />} title="Buffet Style" text="Guests serve themselves from a spread of Capitol signature dishes. Choose from curated packages tailored to your group size and budget." path="/catering/buffet" />
        <ChoiceCard featured icon={<UtensilsCrossed size={24} />} title="Individually Packed Meals" text="Perfect for corporate events, school functions, or any occasion where convenience matters. Each guest receives a neatly packed meal." path="/catering/packed" />
      </div>
      <p className="catering-note">Not sure which to choose? <a href="mailto:reservations@capitolrestaurant.com">Contact us</a>.</p>
    </section>
  </div>;
}

function ChoiceCard({ icon, title, text, path, featured = false }: { icon: ReactNode; title: string; text: string; path: string; featured?: boolean }) {
  return <Link className={`choice-card ${featured ? 'choice-card--featured' : ''}`} to={path}>
    {featured && <span className="choice-card__badge">Popular</span>}
    <span className="choice-card__icon">{icon}</span><h3>{title}</h3><div className="choice-card__rule" />
    <p>{text}</p><span className="choice-card__action">Select <ArrowRight size={16} /></span>
  </Link>;
}
