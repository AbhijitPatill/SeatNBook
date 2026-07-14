import { useState } from "react";
import apiClient from "../../api/client";

function ReportsPage() {
  const [summaryEventId, setSummaryEventId] = useState("");
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGetSummary(e) {
    e.preventDefault();
    setSummaryError("");
    setSummary(null);
    setLoading(true);
    try {
      const res = await apiClient.get(`/reports/events/${summaryEventId}/summary`);
      setSummary(res.data);
    } catch (err) {
      setSummaryError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-1">Revenue Reports</h1>
      <p className="text-muted text-sm mb-10">View booking summary and revenue per event.</p>

      <form onSubmit={handleGetSummary} className="space-y-4 mb-8">
        <div>
          <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Event ID</label>
          <input
            type="text"
            value={summaryEventId}
            onChange={(e) => setSummaryEventId(e.target.value)}
            placeholder="e.g. 1"
            required
            className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal max-w-xs"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-gold text-bg font-bold px-6 py-3 rounded hover:brightness-110 transition disabled:opacity-50"
        >
          {loading ? "Loading..." : "Get summary"}
        </button>
        {summaryError && (
          <div className="text-sm rounded px-3.5 py-2.5 bg-red/10 border border-red text-red max-w-md">
            {summaryError}
          </div>
        )}
      </form>

      {summary && (
        <div className="bg-panel border border-border rounded-xl p-6 max-w-2xl">
          <div className="font-display text-2xl mb-1">{summary.event.title}</div>
          <div className="flex gap-8 mb-6">
            <div>
              <div className="text-xs text-muted uppercase tracking-wide">Total revenue</div>
              <div className="font-mono text-xl text-gold">₹{summary.total_revenue}</div>
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wide">Seats booked</div>
              <div className="font-mono text-xl">{summary.total_seats_booked}</div>
            </div>
          </div>
          <div className="text-xs text-muted uppercase tracking-wide mb-2">Per-show breakdown</div>
          <div className="space-y-2">
            {summary.shows.map((s) => (
              <div key={s.show_id} className="flex justify-between text-sm border-t border-border pt-2">
                <span>{new Date(s.show_date).toLocaleDateString()} · {s.show_time}</span>
                <span className="font-mono">
                  {s.seats_booked} booked · {s.seats_available} left · ₹{s.revenue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;