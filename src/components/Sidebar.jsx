import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const MENU = [
  { to: "/", label: "Home", icon: IconHome },
  { to: "/booking", label: "Booking", icon: IconBooking },
  { to: "/booking-list", label: "Booking List", icon: IconList },
  { to: "/voucher-list", label: "Voucher List", icon: IconVoucher },
  { to: "/invoice-list", label: "Invoice List", icon: IconInvoice },
  { to: "/payment-list", label: "Payment List", icon: IconPayment },
  { to: "/report", label: "Report", icon: IconReport },
  { to: "/users-management", label: "Users Management", icon: IconUsers },
];

const STORAGE_KEY = "sidebar:collapsed";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const toggle = () => setCollapsed((v) => !v);

  const initials = useMemo(() => {
    const src = user?.full_name || user?.username || "";
    return src
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() || "")
      .join("");
  }, [user]);

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-64"
      } shrink-0 h-screen sticky top-0 flex flex-col text-white
      bg-brand-800 border-r border-brand-900
      transition-[width] duration-200 ease-out`}
    >
      {/* Brand */}
      <div
        className={`h-16 flex items-center ${
          collapsed ? "justify-center px-2" : "px-4 gap-3"
        }`}
      >
        <div className="h-9 w-9 rounded-lg bg-brand-900 ring-1 ring-brand-700 flex items-center justify-center shrink-0">
          <img src="/icon.png" alt="Logo" className="h-6 w-6 object-contain" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium leading-tight truncate">
              SamuiLook Inbound
            </div>
            <div className="text-xs text-brand-200 truncate">
              Booking Workspace
            </div>
          </div>
        )}
      </div>

      <div className="mx-3 h-px bg-brand-900" />

      {/* Section label */}
      {!collapsed && (
        <div className="px-5 pt-4 pb-1 text-[10px] tracking-[0.14em] font-medium text-brand-300 uppercase">
          Menu
        </div>
      )}

      {/* Menu */}
      <nav
        className={`flex-1 overflow-y-auto py-2 ${
          collapsed ? "px-2" : "px-3"
        } space-y-0.5`}
      >
        {MENU.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `group relative flex items-center ${
                collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 h-10"
              } rounded-lg text-sm transition-colors
              ${
                isActive
                  ? "bg-brand-900 text-white font-medium"
                  : "text-brand-100 hover:text-white hover:bg-brand-900/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-white" />
                )}
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? "text-white" : "text-brand-200 group-hover:text-white"
                  }`}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 h-px bg-brand-900" />

      {/* User */}
      <div className={`${collapsed ? "px-2 py-3" : "px-3 py-3"}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-brand-900 ring-1 ring-brand-700 flex items-center justify-center text-xs font-medium shrink-0">
              {initials || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {user?.full_name || user?.username}
              </div>
              <div className="text-xs text-brand-200 truncate">
                {user?.role || "user"}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              aria-label="Logout"
              className="p-1.5 rounded-md text-brand-200 hover:text-white hover:bg-brand-900 transition"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              title={user?.full_name || user?.username}
              className="h-9 w-9 rounded-full bg-brand-900 ring-1 ring-brand-700 flex items-center justify-center text-xs font-medium"
            >
              {initials || "U"}
            </div>
            <button
              onClick={logout}
              title="Logout"
              aria-label="Logout"
              className="p-2 rounded-md text-brand-200 hover:text-white hover:bg-brand-900 transition"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-brand-800 ring-1 ring-brand-900 hover:bg-brand-900 text-brand-100 hover:text-white flex items-center justify-center shadow-md transition"
      >
        {collapsed ? (
          <IconChevronRight className="w-3.5 h-3.5" />
        ) : (
          <IconChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}

/* ---------- Inline SVG icons ---------- */
function IconHome(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function IconBooking(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}
function IconList(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  );
}
function IconVoucher(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M9 8v8" />
    </svg>
  );
}
function IconInvoice(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 14h6M9 17h4" />
    </svg>
  );
}
function IconPayment(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  );
}
function IconReport(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
  );
}
function IconUsers(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconLogout(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
function IconChevronLeft(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function IconChevronRight(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
