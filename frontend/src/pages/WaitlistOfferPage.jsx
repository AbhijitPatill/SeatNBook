import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import apiClient from "../api/client";

function WaitlistOfferPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");
  const showId = searchParams.get("show");
  const seatId = searchParams.get("seat");
  const entryId = searchParams.get("entry");

  async function handleClaim() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/bookings/waitlist-checkout", {
        showId: Number(showId),
        seatId: Number(seatId),
        waitlistEntryId: Number(entryId),
        token,
      });
      navigate("/booking-confirmed", { state: { booking: res.data.booking } });
    } catch (err) {
      setError(err.response?.data?.error || "This offer is no longer valid");
    } finally {
      setLoading(false);
    }
  }

  const missingParams = !token || !showId || !seatId || !entryId;

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="bg-panel border border-border rounded-xl p-9">
        <h2 className="font-display text-3xl mb-3">A seat opened up!</h2>
        <p className="text-muted text-sm mb-8">
          Claim your seat now before this offer expires.
        </p>

        {missingParams && (
          <div className="bg-red/10 border border-red text-red text-sm rounded px-3.5 py-2.5 mb-4">
            This link looks incomplete. Please use the link from your email exactly as sent.
          </div>
        )}

        {error && (
          <div className="bg-red/10 border border-red text-red text-sm rounded px-3.5 py-2.5 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={loading || missingParams}
          className="w-full bg-gold text-bg font-bold py-3.5 rounded hover:brightness-110 transition disabled:opacity-50"
        >
          {loading ? "Claiming…" : "Claim this seat"}
        </button>
      </div>
    </div>
  );
}

export default WaitlistOfferPage;