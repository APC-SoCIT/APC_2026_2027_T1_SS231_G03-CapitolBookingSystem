import { ArrowRight, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PACKED_MENU_ITEMS } from '../constants';

export function CateringPacked() {
  const categories = ['All', ...new Set(PACKED_MENU_ITEMS.map((item) => item.category))];
  const [activeCategory, setActiveCategory] = useState('All');
  const [submitted, setSubmitted] = useState(false);
  const displayItems = useMemo(() => activeCategory === 'All' ? PACKED_MENU_ITEMS : PACKED_MENU_ITEMS.filter((item) => item.category === activeCategory), [activeCategory]);
  return <div>
    <div className="breadcrumb"><Link to="/catering">Catering</Link><ChevronRight size={14} /><span>Individually Packed Meals</span></div>
    <section className="subpage-hero"><h1>Individually Packed Meals</h1><p>Browse our menu, then proceed to select your reservation date and time.</p></section>
    <section className="section packed-section"><div className="filter-row">{categories.map((category) => <button className={activeCategory === category ? 'filter-button filter-button--active' : 'filter-button'} key={category} onClick={() => setActiveCategory(category)} type="button">{category}</button>)}</div>
      <div className="menu-grid">{displayItems.map((item) => <article className="menu-card" key={item.id}><div className="menu-card__top"><h2>{item.name}</h2><strong>₱{item.price}</strong></div><span className="menu-card__category">{item.category}</span><p>{item.description}</p></article>)}</div>
      <div className="proceed-bar"><p>Ready to reserve your packed meal catering?</p><button className="button button--red" onClick={() => setSubmitted(true)} type="button">Proceed <ArrowRight size={16} /></button></div>
      {submitted && <p className="demo-notice">Demo reservation started for packed meals. Date and guest details will be added in the next booking chunk.</p>}
    </section>
  </div>;
}
