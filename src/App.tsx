import { Layout } from "./components/common";
import { AboutUs } from "./pages/AboutUs";
import { Catering } from "./pages/Catering";
import { CateringBuffet } from "./pages/CateringBuffet";
import { CateringPacked } from "./pages/CateringPacked";
import { FunctionRooms } from "./pages/FunctionRooms";
import { Delivery } from "./pages/Delivery";
import { DeliveryStaff } from "./pages/DeliveryStaff";
import { DeliveryOrder } from "./pages/DeliveryOrder";
import { Operations } from "./pages/Operations";
import { Home } from "./pages/Home";
import { Inquiries } from "./pages/Inquiries";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function ProtectedOperations() {
  const { isAdmin, loading, user } = useAuth();
  if (loading) return <div className="auth-loading">Loading account...</div>;
  if (isAdmin) return <Operations />;
  return (
    <div className="placeholder-page">
      <h1>Admin Only</h1>
      <p>
        Current role: <strong>{user?.role ?? "not signed in"}</strong>
        {user?.email ? <> · {user.email}</> : null}
      </p>
      <p>Please sign in with an administrator account to access Operations.</p>
    </div>
  );
}

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
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/delivery/order" element={<DeliveryOrder />} />
        <Route path="/delivery/staff" element={<DeliveryStaff />} />
        <Route path="/operations" element={<ProtectedOperations />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
