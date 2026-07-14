import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import socket from "../socket";
import StubDivider from "../components/StubDivider";

function SeatMapPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [waitlistMsg, setWaitlistMsg] = useState("");

  const isLoggedIn = !!localStorage.getItem("token");

  async function handleJoinWaitlist(category) {
    setWaitlistMsg("");
    try {
      await apiClient.post("/waitlist/join", { showId: Number(showId), category });
      setWaitlistMsg(`Joined the waitlist for ${category} seats — we'll email you if one opens up.`);
    } catch (err) {
      setWaitlistMsg(err.response?.data?.error || "Something went wrong");
    }
  }

  const fetchSeatMap = useCallback(async () => {
    try {
      const res = await apiClient.get(`/shows/shows/${showId}/seatmap`);
      setSeats(res.data.seats);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load seat map");
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    fetchSeatMap();

    socket.connect();
    socket.emit("join_show", showId);

    function handleSeatUpdate({ seat_id, status }) {
      setSeats((prev) =>
        prev.map((s) =>
          s.seat_id === seat_id || s.seat_id === Number(seat_id)
            ? { ...s, status }
            : s
        )
      );
      setSelected((prev) => prev.filter((id) => id !== seat_id && id !== Number(seat_id)));
    }

    socket.on("seat_update", handleSeatUpdate);

    return () => {
      socket.off("seat_update", handleSeatUpdate);
      socket.disconnect();
    };
  }, [showId, fetchSeatMap]);

  function toggleSeat(seat) {
    if (seat.status !== "available") return;

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    setSelected((prev) =>
      prev.includes(seat.seat_id)
        ? prev.filter((id) => id !== seat.seat_id)
        : [...prev, seat.seat_id]
    );
  }

  async function handleHoldAndCheckout() {
    setError("");
    setCheckingOut(true);

    try {
      for (const seatId of selected) {
        await apiClient.post(`/shows/${showId}/seats/${seatId}/hold`);
      }

      const res = await apiClient.post("/bookings/checkout", {
        showId: Number(showId),
        seatIds: selected,
      });

      navigate("/booking-confirmed", { state: { booking: res.data.booking } });
    } catch (err) {
      setError(err.response?.data?.error || "Checkout failed");
      fetchSeatMap();
      setSelected([]);
    } finally {
      setCheckingOut(false);
    }
  }

  const rows = groupByRow(seats);
  const total = selected.reduce((sum, id) => {
    const seat = seats.find((s) => s.seat_id === id);
    return sum + (seat?.price || 0);
  }, 0);

  if (loading) {
    return <div className="text-center py-20 text-muted">Loading seat map…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-display text-4xl">Select your seats</h2>
        </div>
        <div className="flex gap-5 text-sm text-muted">
          <Legend color="bg-green" label="Available" />
          <Legend color="bg-teal" label="Selected" />
          <Legend color="bg-red" label="Held" />
          <Legend color="bg-border" label="Booked" />
        </div>
      </div>

      {error && (
        <div className="bg-red/10 border border-red text-red text-sm rounded px-3.5 py-2.5 mb-4">
          {error}
        </div>
      )}

      <div className="w-[70%] h-9 mx-auto mb-12 rounded-b-full border-b-2 border-gold-dim bg-gradient-to-b from-gold/20 to-transparent flex items-end justify-center pb-2">
        <span className="text-[11px] tracking-[0.3em] text-gold-dim uppercase">Screen this way</span>
      </div>

      <div className="flex flex-col gap-3 items-center">
        {Object.entries(rows).map(([rowLabel, rowSeats]) => (
          <div key={rowLabel} className="flex items-center gap-3.5">
            <div className="w-4.5 font-mono text-xs text-muted text-center">{rowLabel}</div>
            <div className="flex gap-2">
              {rowSeats.map((seat) => (
                <button
                  key={seat.seat_id}
                  onClick={() => toggleSeat(seat)}
                  disabled={seat.status !== "available"}
                  className={seatClass(seat, selected.includes(seat.seat_id))}
                >
                  {seat.seat_number}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-panel border border-border rounded-xl px-7 py-5 flex justify-between items-center">
        <div className="text-sm text-muted">
          Selected seats:
          <span className="font-mono text-base text-ivory ml-2">{selected.length}</span>
          {" · "}Total:
          <span className="font-mono text-base text-ivory ml-2">₹{total}</span>
        </div>
        <button
          onClick={handleHoldAndCheckout}
          disabled={selected.length === 0 || checkingOut}
          className="bg-gold text-bg font-bold px-7 py-3 rounded hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {checkingOut ? "Processing…" : "Hold & book seats"}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {getSoldOutCategories(seats).map((category) => (
          <button
            key={category}
            onClick={() => handleJoinWaitlist(category)}
            className="border border-teal text-teal text-sm font-semibold px-5 py-2.5 rounded hover:bg-teal hover:text-bg transition"
          >
            Join waitlist — {category} sold out
          </button>
        ))}
      </div>
      {waitlistMsg && (
        <div className="mt-3 text-sm text-teal bg-teal/10 border border-teal rounded px-3.5 py-2.5">
          {waitlistMsg}
        </div>
      )}

      <StubDivider />
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded ${color}`} />
      {label}
    </div>
  );
}

function seatClass(seat, isSelected) {
  const base = "w-7.5 h-7.5 rounded-t-md rounded-b-sm font-mono text-[10px] font-medium flex items-center justify-center transition";
  if (isSelected) return `${base} bg-teal text-[#0a2f2a] outline outline-2 outline-ivory outline-offset-2`;
  if (seat.status === "available") return `${base} bg-green text-[#0d2915] cursor-pointer hover:-translate-y-0.5`;
  if (seat.status === "held") return `${base} bg-red text-[#3d0f14] opacity-55 cursor-not-allowed`;
  return `${base} bg-border text-bg opacity-40 cursor-not-allowed`;
}

function groupByRow(seats) {
  return seats.reduce((acc, seat) => {
    acc[seat.row_label] = acc[seat.row_label] || [];
    acc[seat.row_label].push(seat);
    return acc;
  }, {});
}

function getSoldOutCategories(seats) {
  const categories = [...new Set(seats.map((s) => s.category))];
  return categories.filter((cat) =>
    seats.filter((s) => s.category === cat).every((s) => s.status !== "available")
  );
}

export default SeatMapPage;