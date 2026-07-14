import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <nav className="flex items-center justify-between px-12 py-5 border-b border-border">
      <Link to="/" className="font-display text-2xl tracking-wide">
        SEAT<span className="text-gold">N</span>BOOK
      </Link>
      <div className="flex gap-8 text-sm text-muted">
       <Link to="/browse?category=movie" className="cursor-pointer hover:text-teal transition-colors">Movies</Link>
        <Link to="/browse?category=concert" className="cursor-pointer hover:text-teal transition-colors">Concerts</Link>
        {token && user?.role === "customer" && (
          <Link to="/my-bookings" className="cursor-pointer hover:text-teal transition-colors">
            My bookings
          </Link>
        )}
        {token && (user?.role === "admin" || user?.role === "organiser") && (
          <Link to="/dashboard" className="cursor-pointer hover:text-teal transition-colors">
            Dashboard
          </Link>
        )}
      </div>
      {token ? (
        <button
          onClick={handleLogout}
          className="border border-red text-red text-sm font-semibold px-5 py-2 rounded hover:bg-red hover:text-bg transition-colors"
        >
          Logout
        </button>
      ) : (
        <Link
          to="/login"
          className="border border-gold text-gold text-sm font-semibold px-5 py-2 rounded hover:bg-gold hover:text-bg transition-colors"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}

export default Navbar;