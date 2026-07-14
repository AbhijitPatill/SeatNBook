import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const gradients = [
  "from-[#3D2E12] to-[#1B1611]",
  "from-[#122E2A] to-[#111B1B]",
  "from-[#2E1220] to-[#1B1116]",
  "from-[#122A3D] to-[#11181B]",
];

function NowShowing() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await api.get("/events");
        setEvents(res.data.events.slice(0, 4));
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-12">
        <p className="text-muted text-sm">Loading now showing...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return null; // nothing to show, quietly hide the section
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto px-12 flex justify-between items-end mb-6">
        <h2 className="font-display text-4xl">Now showing</h2>
        <a href="/browse" className="text-teal text-sm font-semibold">Browse all showtimes</a>
      </div>
      <div className="max-w-6xl mx-auto px-12 grid grid-cols-4 gap-5">
        {events.map((event, i) => (
          <div
            key={event.id}
            onClick={() => navigate(`/events/${event.id}/shows`)}
            className="bg-panel border border-border rounded-xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:border-gold-dim transition"
          >
           <div
              className={`h-38 flex items-end p-3 ${!event.image_url ? `bg-gradient-to-br ${gradients[i % gradients.length]}` : ""}`}
              style={event.image_url ? { backgroundImage: `url(${event.image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
            >
              <span className="bg-bg/85 text-gold text-xs font-semibold px-2.5 py-1 rounded">
                {event.category === "concert" ? "Concert" : "Movie"}
              </span>
            </div>
            <div className="p-4">
              <div className="font-display text-lg mb-1">{event.title}</div>
              <div className="text-muted text-xs mb-2.5">
                {event.description || event.venue_name}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-teal text-xs flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                  View showtimes
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NowShowing;