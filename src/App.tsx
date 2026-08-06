import { Layout } from './components/common';
import { AboutUs } from './pages/AboutUs';
import { Catering } from './pages/Catering';
import { CateringBuffet } from './pages/CateringBuffet';
import { CateringPacked } from './pages/CateringPacked';
import { FunctionRooms } from './pages/FunctionRooms';
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
      <Route path="/catering" element={<Catering />} />
      <Route path="/catering/buffet" element={<CateringBuffet />} />
      <Route path="/catering/packed" element={<CateringPacked />} />
      <Route path="/function-rooms" element={<FunctionRooms />} />
      <Route path="/inquiries" element={<Placeholder title="Inquiries" />} />
      <Route path="/delivery" element={<Placeholder title="Delivery" />} />
      <Route path="/delivery/staff" element={<Placeholder title="Delivery Staff Demo" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
