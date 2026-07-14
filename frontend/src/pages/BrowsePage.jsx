import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";

function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const categoryFilter = searchParams.get("category") || "";

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (titleFilter) params.title = titleFilter;
      if (dateFilter) params.date = dateFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await apiClient.get("/shows/events", { params });
      setEvents(res.data.events);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load events");
    } finally {
      setLoading(false);
    }
  }, [titleFilter, dateFilter, categoryFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    fetchEvents();
  }

  function clearFilters() {
    setTitleFilter("");
    setDateFilter("");
    setSearchParams({});
  }

  function setCategory(cat) {
    if (cat === categoryFilter) {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-12 py-14">
      <h1 className="font-display text-5xl mb-2">Browse showtimes</h1>
      <p className="text-muted text-sm mb-6">Find a movie or concert and pick your seats.</p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setCategory("movie")}
          className={`px-5 py-2 rounded text-sm font-semibold border transition ${
            categoryFilter === "movie"
              ? "bg-gold text-bg border-gold"
              : "border-border text-muted hover:border-teal hover:text-teal"
          }`}
        >
          Movies
        </button>
        <button
          onClick={() => setCategory("concert")}
          className={`px-5 py-2 rounded text-sm font-semibold border transition ${
            categoryFilter === "concert"
              ? "bg-gold text-bg border-gold"
              : "border-border text-muted hover:border-teal hover:text-teal"
          }`}
        >
          Concerts
        </button>
        {categoryFilter && (
          <button
            onClick={() => setSearchParams({})}
            className="px-5 py-2 rounded text-sm border border-border text-muted hover:border-red hover:text-red transition"
          >
            All
          </button>
        )}
      </div>

      <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-3 mb-10">
        <input
          type="text"
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          placeholder="Search by title…"
          className="bg-panel2 border border-border text-ivory px-3.5 py-2.5 rounded text-sm focus:outline-none focus:border-teal min-w-[220px]"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-panel2 border border-border text-ivory px-3.5 py-2.5 rounded text-sm focus:outline-none focus:border-teal"
        />
        <button
          type="submit"
          className="bg-gold text-bg font-bold px-6 py-2.5 rounded hover:brightness-110 transition"
        >
          Search
        </button>
        {(titleFilter || dateFilter) && (
          <button
            type="button"
            onClick={clearFilters}
            className="border border-border text-muted px-5 py-2.5 rounded text-sm hover:border-teal hover:text-teal transition"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="bg-red/10 border border-red text-red text-sm rounded px-3.5 py-2.5 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted">Loading events…</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted">No events found. Try a different search.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-panel border border-border rounded-xl overflow-hidden hover:-translate-y-1 hover:border-gold-dim transition"
            >
              <div
                className={`h-32 flex items-end p-3 ${!event.image_url ? "bg-gradient-to-br from-panel2 to-bg" : ""}`}
                style={event.image_url ? { backgroundImage: `url(${event.image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
              >
                <span className="bg-bg/85 text-gold text-xs font-semibold px-2.5 py-1 rounded">
                  {event.category === "concert" ? "Concert" : "Movie"}
                </span>
              </div>
             <div className="p-4 flex flex-col" style={{ minHeight: "140px" }}>
                <div className="font-display text-xl mb-1">{event.title}</div>
                <div className="text-muted text-xs mb-3 line-clamp-2 flex-1">
                  {event.description || ""}
                </div>
                <Link
                  to={`/events/${event.id}/shows`}
                  className="inline-block border border-teal text-teal text-sm font-semibold px-4 py-2 rounded hover:bg-teal hover:text-bg transition self-start"
                >
                  View showtimes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BrowsePage;