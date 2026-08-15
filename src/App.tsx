import { Layout } from "./components/common";
import { AboutUs } from "./pages/AboutUs";
import { Catering } from "./pages/Catering";
import { CateringBuffet } from "./pages/CateringBuffet";
import { CateringPacked } from "./pages/CateringPacked";
import { FunctionRooms } from "./pages/FunctionRooms";
import { Delivery } from "./pages/Delivery";
import { DeliveryStaff } from "./pages/DeliveryStaff";
import { DeliveryOrder } from "./pages/DeliveryOrder";
import { Dashboard } from "./pages/Dashboard";
import { Home } from "./pages/Home";
import { Analytics } from "./pages/Analytics";
import { Inquiries } from "./pages/Inquiries";
import { Navigate, Route, Routes } from "react-router-dom";

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
        <Route path="/inquiries" element={<Inquiries />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/delivery/order" element={<DeliveryOrder />} />
        <Route path="/delivery/staff" element={<DeliveryStaff />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
