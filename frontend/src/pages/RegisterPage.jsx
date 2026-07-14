import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";

function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiClient.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-panel border border-border rounded-xl p-9">
        <h2 className="font-display text-3xl mb-1.5">Create your account</h2>
        <p className="text-muted text-sm mb-7">Start booking in a couple of minutes.</p>

        {error && (
          <div className="bg-red/10 border border-red text-red text-sm rounded px-3.5 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4.5">
            <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              required
              className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div className="mb-4.5">
            <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@email.com"
              required
              className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div className="mb-4.5">
            <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div className="mb-4.5">
            <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">I am a</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal"
            >
              <option value="customer">Customer — booking tickets</option>
              <option value="organiser">Organiser — hosting events</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-bg font-bold py-3.5 rounded hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="text-center text-sm text-muted mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-teal">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;