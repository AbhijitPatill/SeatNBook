import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";

const adminNavItems = [
  { path: "/dashboard", label: "Overview", exact: true },
  { path: "/dashboard/venues", label: "Venues & Seats" },
];

const organiserNavItems = [
  { path: "/dashboard/events", label: "My Events", exact: true },
  { path: "/dashboard/reports", label: "Reports" },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const navItems = user?.role === "admin" ? adminNavItems : organiserNavItems;

  function isActive(item) {
    return item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 140px)", background: "#17140F" }}>
      <aside
        style={{
          width: "220px",
          borderRight: "1px solid #3D3826",
          padding: "32px 0",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 24px 24px", borderBottom: "1px solid #3D3826", marginBottom: "16px" }}>
          <p style={{ color: "#ADA890", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            {user?.role === "admin" ? "Admin Panel" : "Organiser Panel"}
          </p>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: "10px 24px",
                color: isActive(item) ? "#F0B429" : "#F7F3E8",
                background: isActive(item) ? "#211E17" : "transparent",
                borderLeft: isActive(item) ? "2px solid #F0B429" : "2px solid transparent",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: isActive(item) ? "600" : "400",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "24px", marginTop: "16px", borderTop: "1px solid #3D3826" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "transparent",
              border: "1px solid #3D3826",
              color: "#ADA890",
              borderRadius: "4px",
              padding: "8px 16px",
              fontSize: "0.8rem",
              cursor: "pointer",
              width: "100%",
            }}
          >
            ← Back to site
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "40px" }}>
        <Outlet />
      </main>
    </div>
  );
}