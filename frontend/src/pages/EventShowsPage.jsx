import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/client";

function EventShowsPage() {
  const { eventId } = useParams();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient
      .get(`/shows/events/${eventId}/shows`)
      .then((res) => setShows(res.data.shows))
      .catch((err) => setError(err.response?.data?.error || "Could not load showtimes"))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div className="text-center py-20 text-muted">Loading showtimes…</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      {shows.length > 0 && (
        <>
          <h1 className="font-display text-4xl mb-1">{shows[0].title}</h1>
          <p className="text-muted text-sm mb-8">{shows[0].venue_name}</p>
        </>
      )}

      {error && (
        <div className="bg-red/10 border border-red text-red text-sm rounded px-3.5 py-2.5 mb-6">
          {error}
        </div>
      )}

      {shows.length === 0 && !error ? (
        <div className="text-muted text-center py-10">No showtimes scheduled yet.</div>
      ) : (
        <div className="space-y-3">
          {shows.map((show) => (
            <div
              key={show.id}
              className="bg-panel border border-border rounded-xl px-6 py-4 flex justify-between items-center"
            >
              <div className="font-mono text-sm">
                {new Date(show.show_date).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                · {show.show_time}
              </div>
              <Link
                to={`/shows/${show.id}/seatmap`}
                className="bg-gold text-bg font-bold text-sm px-5 py-2.5 rounded hover:brightness-110 transition"
              >
                Select seats
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventShowsPage;