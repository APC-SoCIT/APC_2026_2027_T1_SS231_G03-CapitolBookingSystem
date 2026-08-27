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
import { Operations } from "./pages/Operations";
import { Home } from "./pages/Home";
import { Inquiries } from "./pages/Inquiries";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function ProtectedDashboard() {
  const { isAdmin, loading, user } = useAuth();
  if (loading) return <div className="auth-loading">Loading account...</div>;
  if (isAdmin) return <Dashboard />;
  return (
    <div className="placeholder-page">
      <h1>Admin Only</h1>
      <p>
        Current role: <strong>{user?.role ?? "not signed in"}</strong>
        {user?.email ? <> · {user.email}</> : null}
      </p>
      <p>Please sign in with an administrator account to access Dashboard.</p>
    </div>
  );
}

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

function CustomerOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="auth-loading">Loading account...</div>;
  if (isAdmin) return <Navigate to="/operations" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route
          path="/catering"
          element={
            <CustomerOnly>
              <Catering />
            </CustomerOnly>
          }
        />
        <Route
          path="/catering/buffet"
          element={
            <CustomerOnly>
              <CateringBuffet />
            </CustomerOnly>
          }
        />
        <Route
          path="/catering/packed"
          element={
            <CustomerOnly>
              <CateringPacked />
            </CustomerOnly>
          }
        />
        <Route
          path="/function-rooms"
          element={
            <CustomerOnly>
              <FunctionRooms />
            </CustomerOnly>
          }
        />
        <Route path="/inquiries" element={<Inquiries />} />
        <Route
          path="/delivery"
          element={
            <CustomerOnly>
              <Delivery />
            </CustomerOnly>
          }
        />
        <Route
          path="/delivery/order"
          element={
            <CustomerOnly>
              <DeliveryOrder />
            </CustomerOnly>
          }
        />
        <Route
          path="/delivery/staff"
          element={
            <CustomerOnly>
              <DeliveryStaff />
            </CustomerOnly>
          }
        />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="/operations" element={<ProtectedOperations />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
