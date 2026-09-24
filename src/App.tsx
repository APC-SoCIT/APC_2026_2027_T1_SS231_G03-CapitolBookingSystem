import type { ReactNode } from "react";
import { Layout } from "./components/common";
import { AboutUs } from "./pages/AboutUs";
import { Catering } from "./pages/Catering";
import { CateringBuffet } from "./pages/CateringBuffet";
import { CateringPacked } from "./pages/CateringPacked";
import { FunctionRooms } from "./pages/FunctionRooms";
import { FunctionRoomReservation } from "./pages/FunctionRoomReservation";
import { Delivery } from "./pages/Delivery";
import { AdminDelivery } from "./pages/AdminDelivery";
import { DeliveryOrder } from "./pages/DeliveryOrder";
import { DeliveryRider } from "./pages/DeliveryRider";
import { DeliveryMenuManager } from "./pages/DeliveryMenuManager";
import { Dashboard } from "./pages/Dashboard";
import { Operations } from "./pages/Operations";
import { Home } from "./pages/Home";
import { Inquiries } from "./pages/Inquiries";
import { Profile } from "./pages/Profile";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { canAccessRoute, getRoleHome } from "./lib/roles";

function RoleGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="auth-loading">Loading account...</div>;
  if (canAccessRoute(user, pathname)) return <>{children}</>;
  const home = user ? getRoleHome(user.role) : "/";
  if (home) return <Navigate to={home} replace />;
  return (
    <div className="placeholder-page" role="alert">
      <h1>Account access unavailable</h1>
      <p>Your account has no valid role. Contact the restaurant or sign out to continue.</p>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <RoleGuard>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/catering" element={<Catering />} />
          <Route path="/catering/buffet" element={<CateringBuffet />} />
          <Route path="/catering/packed" element={<CateringPacked />} />
          <Route path="/function-rooms" element={<FunctionRooms />} />
          <Route path="/function-rooms/reserve" element={<FunctionRoomReservation />} />
          <Route path="/inquiries" element={<Inquiries />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/delivery/order" element={<DeliveryOrder />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/delivery/staff" element={<AdminDelivery />} />
          <Route path="/delivery/items" element={<DeliveryMenuManager />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/delivery/rider" element={<DeliveryRider />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RoleGuard>
    </Layout>
  );
}
