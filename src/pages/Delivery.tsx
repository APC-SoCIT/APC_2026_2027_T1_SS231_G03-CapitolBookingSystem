import { Check, Clock3, MapPin, Package, Search, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getDeliveryOrders, type DeliveryOrder, DELIVERY_STATUSES } from '../data/delivery';

export function Delivery() {
  const [reference, setReference] = useState('');
  const [searchedReference, setSearchedReference] = useState('');
  const orders = getDeliveryOrders();
  const order = useMemo(() => orders.find((item) => item.reference.toLowerCase() === searchedReference.trim().toLowerCase()), [orders, searchedReference]);

  return <div>
    <section className="page-hero"><p className="eyebrow">Capitol Restaurant</p><h1>Delivery Tracking</h1><p>Follow your Capitol order from our kitchen to your doorstep.</p></section>
    <section className="section delivery-section">
      <div className="tracking-search"><div><p className="eyebrow">Demo tracking</p><h2>Where is your order?</h2><p>Enter your booking reference to view the latest delivery status.</p></div><div className="search-control"><label htmlFor="delivery-reference">Booking reference</label><div><input id="delivery-reference" placeholder="e.g. CAP-1042" value={reference} onChange={(event) => setReference(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && setSearchedReference(reference)} /><button className="button button--red" onClick={() => setSearchedReference(reference)} type="button"><Search size={17} /> Track</button></div></div></div>
      {!searchedReference && <DemoReferenceHint onSelect={(value) => { setReference(value); setSearchedReference(value); }} />}
      {searchedReference && !order && <div className="empty-state"><Package size={28} /><strong>We could not find that reference.</strong><span>Try one of the demo references: CAP-1042, CAP-1043, or CAP-1044.</span></div>}
      {order && <TrackingResult order={order} />}
    </section>
  </div>;
}

function DemoReferenceHint({ onSelect }: { onSelect: (value: string) => void }) {
  return <div className="demo-reference"><span>Try a demo order:</span>{['CAP-1042', 'CAP-1043', 'CAP-1044'].map((reference) => <button key={reference} onClick={() => onSelect(reference)} type="button">{reference}</button>)}</div>;
}

function TrackingResult({ order }: { order: DeliveryOrder }) {
  const activeIndex = DELIVERY_STATUSES.indexOf(order.status);
  return <div className="tracking-result"><div className="order-summary"><div><span className="order-summary__label">Booking reference</span><strong>{order.reference}</strong></div><div><span className="order-summary__label">Estimated arrival</span><strong>{order.eta}</strong></div><span className={`status-pill status-pill--${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></div><div className="tracking-layout"><div className="tracking-timeline"><h2>Delivery progress</h2>{DELIVERY_STATUSES.map((status, index) => <div className={`timeline-step ${index <= activeIndex ? 'timeline-step--active' : ''} ${index === activeIndex ? 'timeline-step--current' : ''}`} key={status}><span className="timeline-step__icon">{index === 0 ? <Package size={16} /> : index === 1 ? <Clock3 size={16} /> : index === 2 ? <Truck size={16} /> : <Check size={16} />}</span><div><strong>{status}</strong><small>{status === order.status ? `Updated ${order.placedAt}` : index < activeIndex ? 'Completed' : 'Waiting for previous step'}</small></div></div>)}</div><MockMap order={order} /></div><div className="delivery-details"><span><MapPin size={16} /> Delivering to <strong>{order.address}</strong></span><span><Package size={16} /> {order.items}</span></div></div>;
}

function MockMap({ order }: { order: DeliveryOrder }) {
  const delivered = order.status === 'Delivered';
  return <div className="mock-map"><div className="mock-map__grid" /><span className="mock-map__road mock-map__road--one" /><span className="mock-map__road mock-map__road--two" /><div className="map-marker map-marker--restaurant"><Package size={16} /></div><div className={`map-marker map-marker--home ${delivered ? 'map-marker--delivered' : ''}`}><MapPin size={17} /></div><span className="mock-map__label">{delivered ? 'Delivered' : 'Demo route'}</span></div>;
}
