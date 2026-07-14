import { useLocation, useNavigate, Link } from "react-router-dom";
import StubDivider from "../components/StubDivider";

function BookingConfirmedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  // If someone lands here directly (refresh, bad link, no state) — don't crash, redirect gracefully
  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-3xl tracking-wide text-ivory mb-4">
          NO BOOKING FOUND
        </h1>
        <p className="text-muted mb-8">
          We couldn't find a booking to show you. If you just completed checkout,
          check your email for your ticket, or view it in My Bookings.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-gold text-bg font-bold text-sm px-7 py-3.5 rounded hover:brightness-110 hover:-translate-y-0.5 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-20">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-full bg-teal/15 border border-teal flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-7 h-7 text-teal"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-4xl tracking-wide text-ivory mb-2">
          BOOKING CONFIRMED
        </h1>
        <p className="text-muted text-sm">
          Your seats are locked in. A copy of your ticket is on its way to your email.
        </p>
      </div>

      <div className="bg-panel border border-border rounded-lg p-8 shadow-2xl shadow-black/50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted mb-1">
              Booking Reference
            </p>
            <p className="font-mono text-2xl text-gold tracking-wider">
              {booking.reference}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-muted mb-1">
              Total Paid
            </p>
            <p className="font-mono text-2xl text-ivory">
              ₹{Number(booking.total_amount).toFixed(2)}
            </p>
          </div>
        </div>

        <StubDivider />

        <p className="text-muted text-xs text-center mt-6">
          Show this reference at the venue, or use the QR code sent to your email.
        </p>
      </div>

      <div className="flex gap-3 mt-8 justify-center">
        <Link
          to="/my-bookings"
          className="bg-gold text-bg font-bold text-sm px-7 py-3.5 rounded hover:brightness-110 hover:-translate-y-0.5 transition"
        >
          View My Bookings
        </Link>
        <Link
          to="/"
          className="border border-border text-ivory text-sm px-7 py-3.5 rounded hover:border-teal hover:text-teal transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default BookingConfirmedPage;