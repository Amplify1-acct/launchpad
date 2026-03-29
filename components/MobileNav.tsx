"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "⚡", label: "Home" },
  { href: "/dashboard/preview", icon: "🌐", label: "Website" },
  { href: "/dashboard/blog", icon: "✍️", label: "Blog" },
  { href: "/dashboard/social", icon: "📱", label: "Social" },
  { href: "/dashboard/settings", icon: "⚙️", label: "Settings" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      display: "flex",
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "#fff",
      borderTop: "1px solid #e8e8e8",
      zIndex: 100,
      boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
    }}
    className="mobile-nav-bar"
    >
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              padding: "10px 4px",
              textDecoration: "none",
              color: isActive ? "#0066ff" : "#9a9a9a",
              transition: "color 0.15s",
            }}
          >
            <span style={{ fontSize: "20px", lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.02em" }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
