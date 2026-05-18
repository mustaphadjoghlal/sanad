import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, Radio } from "lucide-react";
import { useState, useEffect } from "react";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "الرئيسية" },
    { to: "/courses", label: "الدورات التدريبية" },
    { to: "/equipment", label: "متجر العتاد" },
    { to: "/jobs", label: "عروض التوظيف" },
    { to: "/competitions", label: "المسابقات" },
    { to: "/voice-requests", label: "طلبات المنشطين" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: "#0b0f0b" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(11,15,11,0.95)"
            : "rgba(11,15,11,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,98,51,0.3)",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.5)" : "none",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group"
              style={{ textDecoration: "none" }}
            >
              <div
                className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, #006233, #008545)",
                  boxShadow: "0 0 12px rgba(0,98,51,0.4)",
                }}
              >
                <Radio size={18} color="#ffffff" />
              </div>
              <span
                className="font-bold text-2xl"
                style={{
                  background: "linear-gradient(90deg, #00a355, #4caf50)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                سند
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="relative px-3 py-2 text-sm rounded-lg transition-all duration-200"
                    style={{
                      color: isActive ? "#00a355" : "#a5d6a7",
                      background: isActive ? "rgba(0,98,51,0.15)" : "transparent",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "#e8f5e9";
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,98,51,0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "#a5d6a7";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }
                    }}
                  >
                    {link.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 right-3 left-3 h-0.5 rounded-full"
                        style={{
                          background: "linear-gradient(90deg, transparent, #00a355, transparent)",
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg transition-all duration-200"
              style={{
                color: "#a5d6a7",
                background: mobileMenuOpen ? "rgba(0,98,51,0.2)" : "transparent",
                border: "1px solid rgba(0,98,51,0.3)",
              }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav
              className="md:hidden pb-4 flex flex-col gap-1 animate-fade-in-down"
              style={{ borderTop: "1px solid rgba(0,98,51,0.2)", paddingTop: "0.75rem" }}
            >
              {navLinks.map((link, i) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-4 py-2.5 rounded-lg transition-all duration-200 animate-slide-in-right"
                    style={{
                      color: isActive ? "#00a355" : "#a5d6a7",
                      background: isActive ? "rgba(0,98,51,0.15)" : "transparent",
                      textDecoration: "none",
                      animationDelay: `${i * 0.05}s`,
                      opacity: 0,
                      animationFillMode: "forwards",
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Bottom accent line */}
        <div
          className="h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0,163,85,0.4), transparent)",
          }}
        />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "linear-gradient(180deg, #0b0f0b 0%, #060a06 100%)",
          borderTop: "1px solid rgba(0,98,51,0.2)",
        }}
      >
        <div
          className="h-px mb-8"
          style={{
            background: "linear-gradient(90deg, transparent, #006233, #00a355, #006233, transparent)",
          }}
        />
        <div className="container mx-auto px-4 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="p-1.5 rounded-md"
              style={{ background: "linear-gradient(135deg, #006233, #008545)" }}
            >
              <Radio size={14} color="#ffffff" />
            </div>
            <span
              className="font-bold text-lg"
              style={{
                background: "linear-gradient(90deg, #00a355, #4caf50)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              سند
            </span>
          </div>
          <p style={{ color: "#6aad6a" }} className="mb-1 text-sm">
            المنصة الجزائرية الشاملة لمجال الإعلام
          </p>
          <p style={{ color: "#3a5e3a" }} className="text-xs">
            جميع الحقوق محفوظة © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
