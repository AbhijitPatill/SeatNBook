import { useState, useEffect } from "react";
import apiClient from "../../api/client";
import StubDivider from "../../components/StubDivider";

function EventsPage() {
  const [venues, setVenues] = useState([]);

  const [eventForm, setEventForm] = useState({ title: "", description: "", venue_id: "" });
  const [eventMsg, setEventMsg] = useState("");

  const [showForm, setShowForm] = useState({ event_id: "", show_date: "", show_time: "" });
  const [showMsg, setShowMsg] = useState("");
  const [createdShowId, setCreatedShowId] = useState(null);

  const [pricingForm, setPricingForm] = useState({ show_id: "", premium: "", standard: "" });
  const [pricingMsg, setPricingMsg] = useState("");

  useEffect(() => {
    apiClient.get("/venues").then((res) => setVenues(res.data.venues)).catch(() => {});
  }, []);

  async function handleCreateEvent(e) {
    e.preventDefault();
    setEventMsg("");
    try {
      const res = await apiClient.post("/events", eventForm);
      setEventMsg(`Event created: "${res.data.event.title}" (ID: ${res.data.event.id})`);
      setEventForm({ title: "", description: "", venue_id: "", category: "movie", image_url: "" });
    } catch (err) {
      setEventMsg(err.response?.data?.error || "Something went wrong");
    }
  }

  async function handleCreateShow(e) {
    e.preventDefault();
    setShowMsg("");
    try {
      const res = await apiClient.post(`/events/${showForm.event_id}/shows`, {
        show_date: showForm.show_date,
        show_time: showForm.show_time,
      });
      setShowMsg(`Show created (ID: ${res.data.show.id}) — now set pricing below`);
      setCreatedShowId(res.data.show.id);
      setPricingForm((prev) => ({ ...prev, show_id: res.data.show.id }));
    } catch (err) {
      setShowMsg(err.response?.data?.error || "Something went wrong");
    }
  }

  async function handleSetPricing(e) {
    e.preventDefault();
    setPricingMsg("");
    try {
      await apiClient.post(`/events/shows/${pricingForm.show_id}/pricing`, {
        pricing: [
          { category: "Premium", price: Number(pricingForm.premium) },
          { category: "Standard", price: Number(pricingForm.standard) },
        ],
      });
      setPricingMsg("Pricing set successfully");
    } catch (err) {
      setPricingMsg(err.response?.data?.error || "Something went wrong");
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-1">My Events</h1>
      <p className="text-muted text-sm mb-10">Create events, schedule shows, and set pricing.</p>

      <Section title="1. Create an event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Title"
            value={eventForm.title}
            onChange={(v) => setEventForm({ ...eventForm, title: v })}
            placeholder="Interstellar Re-release"
            required
          />
          <Input
            label="Description (optional)"
            value={eventForm.description}
            onChange={(v) => setEventForm({ ...eventForm, description: v })}
            placeholder="A short description"
          />
          <div>
            <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Venue</label>
            <select
              value={eventForm.venue_id}
              onChange={(e) => setEventForm({ ...eventForm, venue_id: e.target.value })}
              required
              className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal"
            >
              <option value="">Select a venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name} — {v.address}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Category</label>
            <select
              value={eventForm.category}
              onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
              required
              className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal"
            >
              <option value="movie">Movie</option>
              <option value="concert">Concert</option>
            </select>
          </div>
          <Input
            label="Poster image URL (optional)"
            value={eventForm.image_url}
            onChange={(v) => setEventForm({ ...eventForm, image_url: v })}
            placeholder="https://example.com/poster.jpg"
          />
          <SubmitButton>Create event</SubmitButton>
          {eventMsg && <Feedback text={eventMsg} />}
        </form>
      </Section>

      <StubDivider />

      <Section title="2. Schedule a show for that event">
        <form onSubmit={handleCreateShow} className="space-y-4">
          <Input
            label="Event ID"
            value={showForm.event_id}
            onChange={(v) => setShowForm({ ...showForm, event_id: v })}
            placeholder="e.g. 1 (from the event you just created)"
            required
          />
          <Input
            label="Show date"
            type="date"
            value={showForm.show_date}
            onChange={(v) => setShowForm({ ...showForm, show_date: v })}
            required
          />
          <Input
            label="Show time"
            type="time"
            value={showForm.show_time}
            onChange={(v) => setShowForm({ ...showForm, show_time: v })}
            required
          />
          <SubmitButton>Create show</SubmitButton>
          {showMsg && <Feedback text={showMsg} />}
        </form>
      </Section>

      <StubDivider />

      <Section title="3. Set pricing">
        <form onSubmit={handleSetPricing} className="space-y-4">
          <Input
            label="Show ID"
            value={pricingForm.show_id}
            onChange={(v) => setPricingForm({ ...pricingForm, show_id: v })}
            placeholder={createdShowId ? String(createdShowId) : "e.g. 1"}
            required
          />
          <Input
            label="Premium price (₹)"
            type="number"
            value={pricingForm.premium}
            onChange={(v) => setPricingForm({ ...pricingForm, premium: v })}
            placeholder="300"
            required
          />
          <Input
            label="Standard price (₹)"
            type="number"
            value={pricingForm.standard}
            onChange={(v) => setPricingForm({ ...pricingForm, standard: v })}
            placeholder="150"
            required
          />
          <SubmitButton>Set pricing</SubmitButton>
          {pricingMsg && <Feedback text={pricingMsg} />}
        </form>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-display text-2xl mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, required, type = "text" }) {
  return (
    <div>
      <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal"
      />
    </div>
  );
}

function SubmitButton({ children }) {
  return (
    <button
      type="submit"
      className="bg-gold text-bg font-bold px-6 py-3 rounded hover:brightness-110 transition"
    >
      {children}
    </button>
  );
}

function Feedback({ text, isError }) {
  return (
    <div className={`text-sm rounded px-3.5 py-2.5 ${isError ? "bg-red/10 border border-red text-red" : "bg-teal/10 border border-teal text-teal"}`}>
      {text}
    </div>
  );
}

export default EventsPage;