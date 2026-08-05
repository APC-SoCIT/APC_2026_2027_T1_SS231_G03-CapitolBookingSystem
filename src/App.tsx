import { Layout } from './components/common';
import { AboutUs } from './pages/AboutUs';
import { Home } from './pages/Home';
import { Navigate, Route, Routes } from 'react-router-dom';

const Placeholder = ({ title }: { title: string }) => (
  <section className="placeholder-page content-container">
    <p className="eyebrow">Capitol Restaurant</p>
    <h1>{title}</h1>
    <p>This section is scaffolded and will be rebuilt in the next implementation chunk.</p>
  </section>
);

export default function App() {
  return (
    <Layout>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/catering" element={<Placeholder title="Catering" />} />
      <Route path="/catering/buffet" element={<Placeholder title="Buffet Catering" />} />
      <Route path="/catering/packed" element={<Placeholder title="Packed Meals" />} />
      <Route path="/function-rooms" element={<Placeholder title="Function Rooms" />} />
      <Route path="/inquiries" element={<Placeholder title="Inquiries" />} />
      <Route path="/delivery" element={<Placeholder title="Delivery" />} />
      <Route path="/delivery/staff" element={<Placeholder title="Delivery Staff Demo" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
