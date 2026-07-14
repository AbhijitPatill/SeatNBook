import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiClient.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-panel border border-border rounded-xl p-9">
        <h2 className="font-display text-3xl mb-1.5">Welcome back</h2>
        <p className="text-muted text-sm mb-7">Sign in to manage your bookings.</p>

        {error && (
          <div className="bg-red/10 border border-red text-red text-sm rounded px-3.5 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4.5">
            <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              required
              className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div className="mb-4.5">
            <label className="block text-xs text-muted uppercase tracking-wide mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-panel2 border border-border text-ivory px-3.5 py-3 rounded text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-bg font-bold py-3.5 rounded hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-center text-sm text-muted mt-5">
          New here?{" "}
          <Link to="/register" className="text-teal">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;