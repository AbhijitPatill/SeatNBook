import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/client";

function AdminOverviewPage() {
  const [venueCount, setVenueCount] = useState(null);

  useEffect(() => {
    apiClient.get("/venues").then((res) => setVenueCount(res.data.venues.length)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl mb-1">Overview</h1>
      <p className="text-muted text-sm mb-10">Quick snapshot of the platform's inventory.</p>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mb-10">
        <div className="bg-panel border border-border rounded-xl p-6">
          <div className="text-xs text-muted uppercase tracking-wide mb-1">Venues</div>
          <div className="font-mono text-3xl text-gold">{venueCount ?? "—"}</div>
        </div>
      </div>

      <Link
        to="/dashboard/venues"
        className="inline-block bg-gold text-bg font-bold px-6 py-3 rounded hover:brightness-110 transition"
      >
        Manage Venues & Seats →
      </Link>
    </div>
  );
}

export default AdminOverviewPage;