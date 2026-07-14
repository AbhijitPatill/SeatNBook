import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

export default function AdminVenuesPage() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create venue form state
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [creatingVenue, setCreatingVenue] = useState(false);

  // Seat row builder state
  const [rows, setRows] = useState([{ row_label: "A", seat_count: 10, category: "Premium" }]);
  const [addingSeats, setAddingSeats] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token) {
      navigate("/login");
      return;
    }
    if (user?.role !== "admin") {
      setMessage({ type: "error", text: "Admin access only." });
      setLoading(false);
      return;
    }
    fetchVenues();
  }, []);

  async function fetchVenues() {
    try {
      const res = await api.get("/venues");
      setVenues(res.data.venues);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateVenue(e) {
    e.preventDefault();
    if (!venueName.trim()) return;
    setCreatingVenue(true);
    setMessage(null);
    try {
      const res = await api.post("/venues", { name: venueName, address: venueAddress });
      setVenues((prev) => [...prev, res.data.venue]);
      setVenueName("");
      setVenueAddress("");
      setMessage({ type: "success", text: `Venue "${res.data.venue.name}" created.` });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to create venue" });
    } finally {
      setCreatingVenue(false);
    }
  }

  function updateRow(index, field, value) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function addRowField() {
    const nextLetter = String.fromCharCode(65 + rows.length); // A, B, C...
    setRows((prev) => [...prev, { row_label: nextLetter, seat_count: 10, category: "Standard" }]);
  }

  function removeRowField(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddSeats(e) {
    e.preventDefault();
    if (!selectedVenue) return;

    // Expand row definitions into individual seat objects
    const seats = [];
    for (const row of rows) {
      const count = parseInt(row.seat_count, 10);
      if (!row.row_label || !count || count < 1) continue;
      for (let n = 1; n <= count; n++) {
        seats.push({ row_label: row.row_label, seat_number: n, category: row.category });
      }
    }

    if (seats.length === 0) {
      setMessage({ type: "error", text: "Define at least one valid row." });
      return;
    }

    setAddingSeats(true);
    setMessage(null);
    try {
      const res = await api.post(`/venues/${selectedVenue.id}/seats`, { seats });
      setMessage({ type: "success", text: `${res.data.seats.length} seats added to ${selectedVenue.name}.` });
      setRows([{ row_label: "A", seat_count: 10, category: "Premium" }]);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to add seats" });
    } finally {
      setAddingSeats(false);
    }
  }

  const inputStyle = {
    background: "#2A261C",
    border: "1px solid #3D3826",
    color: "#F7F3E8",
    borderRadius: "4px",
    padding: "10px 12px",
    fontSize: "0.9rem",
    outline: "none",
  };

  const labelStyle = {
    color: "#ADA890",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "4px",
    display: "block",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#17140F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#ADA890", fontFamily: "Manrope, sans-serif" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#17140F", padding: "40px 24px", fontFamily: "Manrope, sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "2.5rem", color: "#F7F3E8", letterSpacing: "0.05em", marginBottom: "8px" }}>
          VENUE MANAGEMENT
        </h1>
        <p style={{ color: "#ADA890", marginBottom: "32px" }}>Create venues and build seat layouts.</p>

        {message && (
          <div
            style={{
              background: message.type === "success" ? "#4FAF6D22" : "#E14F5A22",
              border: `1px solid ${message.type === "success" ? "#4FAF6D" : "#E14F5A"}`,
              color: message.type === "success" ? "#4FAF6D" : "#E14F5A",
              borderRadius: "6px",
              padding: "12px 16px",
              marginBottom: "24px",
              fontSize: "0.9rem",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Section 1: Create Venue */}
        <div style={{ background: "#211E17", border: "1px solid #3D3826", borderRadius: "8px", padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.5rem", color: "#F0B429", marginBottom: "16px" }}>
            1. Create Venue
          </h2>
          <form onSubmit={handleCreateVenue} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelStyle}>Venue Name</label>
              <input
                style={{ ...inputStyle, width: "100%" }}
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. PVR Cinema"
                required
              />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelStyle}>Address (optional)</label>
              <input
                style={{ ...inputStyle, width: "100%" }}
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="e.g. MG Road, Pune"
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="submit"
                disabled={creatingVenue}
                style={{ background: "#F0B429", color: "#17140F", border: "none", borderRadius: "4px", padding: "10px 24px", fontWeight: "700", cursor: "pointer", opacity: creatingVenue ? 0.6 : 1 }}
              >
                {creatingVenue ? "Creating..." : "Create Venue"}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Select Venue */}
        <div style={{ background: "#211E17", border: "1px solid #3D3826", borderRadius: "8px", padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.5rem", color: "#F0B429", marginBottom: "16px" }}>
            2. Select Venue for Seat Layout
          </h2>
          {venues.length === 0 ? (
            <p style={{ color: "#ADA890" }}>No venues yet — create one above first.</p>
          ) : (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {venues.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVenue(v)}
                  style={{
                    background: selectedVenue?.id === v.id ? "#F0B429" : "#2A261C",
                    color: selectedVenue?.id === v.id ? "#17140F" : "#F7F3E8",
                    border: "1px solid #3D3826",
                    borderRadius: "4px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                  }}
                >
                  {v.name} (ID: {v.id})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Seat Layout Builder */}
        {selectedVenue && (
          <div style={{ background: "#211E17", border: "1px solid #3D3826", borderRadius: "8px", padding: "24px" }}>
            <h2 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.5rem", color: "#F0B429", marginBottom: "4px" }}>
              3. Build Seat Layout — {selectedVenue.name}
            </h2>
            <p style={{ color: "#ADA890", fontSize: "0.85rem", marginBottom: "16px" }}>
              Define each row: a label, how many seats it has, and its pricing category.
            </p>

            <form onSubmit={handleAddSeats}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {rows.map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <div style={{ width: "80px" }}>
                      <label style={labelStyle}>Row Label</label>
                      <input
                        style={{ ...inputStyle, width: "100%" }}
                        value={row.row_label}
                        onChange={(e) => updateRow(i, "row_label", e.target.value.toUpperCase())}
                        maxLength={3}
                      />
                    </div>
                    <div style={{ width: "100px" }}>
                      <label style={labelStyle}>Seat Count</label>
                      <input
                        type="number"
                        min="1"
                        style={{ ...inputStyle, width: "100%" }}
                        value={row.seat_count}
                        onChange={(e) => updateRow(i, "seat_count", e.target.value)}
                      />
                    </div>
                    <div style={{ width: "160px" }}>
                      <label style={labelStyle}>Category</label>
                      <select
                        style={{ ...inputStyle, width: "100%" }}
                        value={row.category}
                        onChange={(e) => updateRow(i, "category", e.target.value)}
                      >
                        <option value="Premium">Premium</option>
                        <option value="Standard">Standard</option>
                      </select>
                    </div>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRowField(i)}
                        style={{ background: "transparent", border: "1px solid #E14F5A", color: "#E14F5A", borderRadius: "4px", padding: "10px 14px", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={addRowField}
                  style={{ background: "transparent", border: "1px solid #3D3826", color: "#F7F3E8", borderRadius: "4px", padding: "10px 20px", cursor: "pointer" }}
                >
                  + Add Row
                </button>
                <button
                  type="submit"
                  disabled={addingSeats}
                  style={{ background: "#F0B429", color: "#17140F", border: "none", borderRadius: "4px", padding: "10px 24px", fontWeight: "700", cursor: "pointer", opacity: addingSeats ? 0.6 : 1 }}
                >
                  {addingSeats ? "Adding..." : "Add Seats to Venue"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}