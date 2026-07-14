import { Routes, Route, Navigate } from "react-router-dom";
import BulbStrip from "./components/BulbStrip";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SeatMapPage from "./pages/SeatMapPage";
import BookingConfirmedPage from "./pages/BookingConfirmedPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import WaitlistOfferPage from "./pages/WaitlistOfferPage";
import BrowsePage from "./pages/BrowsePage";
import EventShowsPage from "./pages/EventShowsPage";
import AdminOverviewPage from "./pages/dashboard/AdminOverviewPage";
import AdminVenuesPage from "./pages/dashboard/AdminVenuesPage";
import EventsPage from "./pages/dashboard/EventsPage";
import ReportsPage from "./pages/dashboard/ReportsPage";

// Decides which dashboard "home" a role should land on when hitting /dashboard directly
function DashboardIndex() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user?.role === "admin") return <AdminOverviewPage />;
  return <Navigate to="/dashboard/events" replace />;
}

function App() {
  return (
    <div className="min-h-screen bg-bg text-ivory font-body flex flex-col">
      <BulbStrip />
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/events/:eventId/shows" element={<EventShowsPage />} />

          <Route
            path="/shows/:showId/seatmap"
            element={
              <ProtectedRoute>
                <SeatMapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-confirmed"
            element={
              <ProtectedRoute>
                <BookingConfirmedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/waitlist-offer"
            element={
              <ProtectedRoute>
                <WaitlistOfferPage />
              </ProtectedRoute>
            }
          />

          {/* Unified admin/organiser dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardIndex />} />
            <Route path="venues" element={<AdminVenuesPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;