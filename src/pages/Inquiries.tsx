import { Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';

const inquiryTypes = ['General Question', 'Catering', 'Function Room', 'Delivery', 'Feedback'];

export function Inquiries() {
  const [sent, setSent] = useState(false);
  return <div>
    <section className="page-hero"><p className="eyebrow">Capitol Restaurant</p><h1>Inquiries</h1><p>Have a question about our services? Send us a message and our team will be happy to help.</p></section>
    <section className="section inquiries-grid">
      <div className="inquiry-info"><p className="eyebrow">Get in touch</p><h2>Let&apos;s plan something memorable</h2><p>Whether you are planning a family gathering, corporate event, or simply want to learn more about Capitol, we would love to hear from you.</p><div className="contact-list"><a href="mailto:reservations@capitolrestaurant.com"><Mail size={18} /><span><small>Email us</small>reservations@capitolrestaurant.com</span></a><a href="tel:+6328XXXXXXX"><Phone size={18} /><span><small>Call us</small>+63 (2) 8XXX-XXXX</span></a><div><MapPin size={18} /><span><small>Visit us</small>Pasay City, Metro Manila, Philippines</span></div></div></div>
      <div className="inquiry-form"><h2>Send an inquiry</h2><label className="form-field"><span>Full Name</span><input className="input" placeholder="Juan dela Cruz" /></label><label className="form-field"><span>Email Address</span><input className="input" type="email" placeholder="juan@example.com" /></label><label className="form-field"><span>Inquiry Type</span><select className="input" defaultValue=""><option value="">Select inquiry type...</option>{inquiryTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className="form-field"><span>Message</span><textarea className="input" rows={5} placeholder="How can we help?" /></label><button className="button button--red" onClick={() => setSent(true)} type="button">Send Inquiry →</button>{sent && <div className="success-message"><strong>Thank you for your inquiry.</strong><span>This demo submission has been recorded locally. A real backend can be connected later.</span></div>}</div>
    </section>
  </div>;
}
