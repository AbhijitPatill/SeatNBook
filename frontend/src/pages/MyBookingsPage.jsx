import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const res = await api.get("/bookings/my-bookings");
      setBookings(res.data.bookings);
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(bookingId);
    try {
      await api.delete(`/bookings/${bookingId}`);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );
    } catch (err) {
      alert("Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#17140F", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#ADA890", fontFamily: "Manrope, sans-serif" }}>Loading your bookings...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#17140F", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#E14F5A", fontFamily: "Manrope, sans-serif" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#17140F", padding: "40px 24px", fontFamily: "Manrope, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Header */}
        <h1 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "2.5rem", color: "#F7F3E8", letterSpacing: "0.05em", marginBottom: "8px" }}>
          MY BOOKINGS
        </h1>
        <p style={{ color: "#ADA890", marginBottom: "32px" }}>
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} found
        </p>

        {bookings.length === 0 ? (
          <div style={{ background: "#211E17", border: "1px solid #3D3826", borderRadius: "8px", padding: "48px", textAlign: "center" }}>
            <p style={{ color: "#ADA890" }}>You haven't booked any tickets yet.</p>
            <button
              onClick={() => navigate("/")}
              style={{ marginTop: "16px", background: "#F0B429", color: "#17140F", border: "none", borderRadius: "4px", padding: "12px 24px", fontWeight: "700", cursor: "pointer" }}
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {bookings.map((booking) => (
              <div
                key={booking.id}
                style={{
                  background: "#211E17",
                  border: `1px solid ${booking.status === "cancelled" ? "#3D3826" : "#F0B429"}`,
                  borderRadius: "8px",
                  padding: "24px",
                  opacity: booking.status === "cancelled" ? 0.6 : 1,
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <p style={{ fontFamily: "IBM Plex Mono, monospace", color: "#F0B429", fontSize: "1.1rem", letterSpacing: "0.1em", margin: 0 }}>
                      {booking.booking_reference}
                    </p>
                    <h3 style={{ color: "#F7F3E8", margin: "4px 0 0", fontSize: "1.1rem" }}>
                      {booking.event_title}
                    </h3>
                  </div>
                  <span style={{
                    background: booking.status === "confirmed" ? "#4FAF6D22" : "#E14F5A22",
                    color: booking.status === "confirmed" ? "#4FAF6D" : "#E14F5A",
                    border: `1px solid ${booking.status === "confirmed" ? "#4FAF6D" : "#E14F5A"}`,
                    borderRadius: "4px",
                    padding: "4px 12px",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {booking.status}
                  </span>
                </div>

                {/* Details */}
                <div style={{ display: "flex", gap: "24px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ color: "#ADA890", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>Venue</p>
                    <p style={{ color: "#F7F3E8", margin: 0 }}>{booking.venue_name}</p>
                  </div>
                  <div>
                    <p style={{ color: "#ADA890", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>Date & Time</p>
                    <p style={{ color: "#F7F3E8", margin: 0 }}>
                      {new Date(booking.show_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {booking.show_time?.slice(0, 5)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#ADA890", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>Total Paid</p>
                    <p style={{ color: "#F7F3E8", fontFamily: "IBM Plex Mono, monospace", margin: 0 }}>₹{booking.total_amount}</p>
                  </div>
                </div>

                {/* Seats */}
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ color: "#ADA890", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Seats</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {booking.seats?.map((seat) => (
                      <span
                        key={seat.seat_id}
                        style={{
                          background: "#2A261C",
                          border: "1px solid #3D3826",
                          borderRadius: "4px",
                          padding: "4px 10px",
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "0.8rem",
                          color: "#F7F3E8",
                        }}
                      >
                        {seat.row_label}{seat.seat_number} · {seat.category}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cancel button */}
                {booking.status === "confirmed" && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancelling === booking.id}
                    style={{
                      background: "transparent",
                      border: "1px solid #E14F5A",
                      color: "#E14F5A",
                      borderRadius: "4px",
                      padding: "8px 20px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      opacity: cancelling === booking.id ? 0.5 : 1,
                    }}
                  >
                    {cancelling === booking.id ? "Cancelling..." : "Cancel Booking"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}