import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/client";

function Hero() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestBooking() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/bookings/my-bookings");
        const confirmed = res.data.bookings.find((b) => b.status === "confirmed");
        setBooking(confirmed || null);
      } catch (err) {
        console.error("Failed to load latest booking:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatestBooking();
  }, []);

  return (
    <div className="max-w-6xl mx-auto flex items-center gap-14 px-12 py-18">
      <div className="flex-[1.1]">
        <div className="flex items-center text-sm font-semibold uppercase tracking-widest text-teal mb-3.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal mr-2 animate-pulse" />
          Live seat updates
        </div>
        <h1 className="font-display text-7xl leading-[0.95] mb-5">
          Every seat
          <br />
          tells a
          <br />
          <span className="text-gold">story.</span>
        </h1>
        <p className="text-muted text-base leading-relaxed max-w-md mb-8">
          Pick your seats on a live map, hold them while you decide, and get a real ticket in your inbox — QR code included.
        </p>
        <div className="flex gap-3.5">
          <Link
            to="/browse"
            className="bg-gold text-bg font-bold text-sm px-7 py-3.5 rounded hover:brightness-110 hover:-translate-y-0.5 transition inline-block"
          >
            Browse showtimes
          </Link>
          <button className="border border-border text-ivory font-semibold text-sm px-7 py-3.5 rounded hover:border-teal hover:text-teal transition">
            How it works
          </button>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-panel border border-border rounded-xl rotate-2 hover:rotate-0 hover:-translate-y-1 transition shadow-2xl shadow-black/50">
          {loading ? (
            <div className="p-6 text-muted text-sm">Loading ticket preview...</div>
          ) : booking ? (
            <>
              <div className="flex justify-between items-start p-6 pb-5">
                <div>
                  <div className="font-display text-2xl">{booking.event_title}</div>
                  <div className="text-muted text-sm mt-1">
                    {booking.venue_name} ·{" "}
                    {new Date(booking.show_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                    {booking.show_time?.slice(0, 5)}
                  </div>
                </div>
                <div className="bg-gold text-bg font-mono text-xs font-medium px-2.5 py-1.5 rounded whitespace-nowrap">
                  {booking.seats?.map((s) => `${s.row_label}${s.seat_number}`).join(" · ")}
                </div>
              </div>
              <div className="border-t-2 border-dashed border-border mx-5" />
              <div className="flex justify-between items-center p-6 pt-5">
                <div className="font-mono text-sm text-muted">
                  Booking ref
                  <span className="block text-ivory text-base mt-0.5">{booking.booking_reference}</span>
                </div>
                <QRCodeSVG value={booking.booking_reference} size={52} bgColor="transparent" fgColor="#F7F3E8" />
              </div>
            </>
          ) : (
            <div className="p-6">
              <div className="font-display text-2xl mb-1">Your ticket, here</div>
              <div className="text-muted text-sm mb-5">
                Book a show and your real ticket preview shows up right here.
              </div>
              <div className="border-t-2 border-dashed border-border mb-5" />
              <Link to="/browse" className="text-teal text-sm font-semibold">
                Browse showtimes →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Hero;