import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Radio, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { subscribeToUserProfile } from "../../lib/firestore";
import type { UserProfile } from "../../lib/types";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ uid: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null | "admin">(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/", label: "الرئيسية" },
    { to: "/channels", label: "دليل القنوات" },
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? { uid: user.uid } : null);
      if (!user) {
        setUserProfile(null);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }
    const unsub = subscribeToUserProfile(currentUser.uid, (profile) => {
      if (profile) {
        setUserProfile(profile);
      } else {
        // No profile doc in users/ = admin user
        setUserProfile("admin");
      }
    });
    return unsub;
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const isRegularUser = userProfile && userProfile !== "admin";
  const isAdmin = userProfile === "admin" && currentUser;
  const isLoggedOut = !currentUser;

  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: "#0e0e0e" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(11,15,11,0.95)"
            : "rgba(11,15,11,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--p-30)",
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
                  background: "linear-gradient(135deg, var(--theme-primary, #006233), color-mix(in srgb, var(--theme-primary, #006233) 70%, #ffffff))",
                  boxShadow: "0 0 12px var(--p-40)",
                }}
              >
                <Radio size={18} color="#ffffff" />
              </div>
              <span
                className="font-bold text-2xl"
                style={{
                  background: "linear-gradient(90deg, var(--theme-accent, #00a355), color-mix(in srgb, var(--theme-accent, #00a355) 70%, #ffffff))",
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
                      color: isActive ? "var(--theme-accent, #00a355)" : "var(--theme-text-secondary, #a5d6a7)",
                      background: isActive ? "var(--p-15)" : "transparent",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "var(--theme-text, #e8f5e9)";
                        (e.currentTarget as HTMLElement).style.background = "var(--p-10)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "var(--theme-text-secondary, #a5d6a7)";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }
                    }}
                  >
                    {link.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 right-3 left-3 h-0.5 rounded-full"
                        style={{
                          background: "linear-gradient(90deg, transparent, var(--theme-accent, #00a355), transparent)",
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side: Auth buttons */}
            <div className="hidden md:flex items-center gap-2">
              {isLoggedOut && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-1.5 rounded-lg text-sm transition-all duration-200"
                    style={{
                      color: "var(--theme-badge-text, #81c784)",
                      border: "1px solid var(--p-35)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-12)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    دخول
                  </Link>
                  <Link
                    to="/register"
                    className="btn-dz px-4 py-1.5 rounded-lg text-sm"
                    style={{ textDecoration: "none" }}
                  >
                    تسجيل
                  </Link>
                </>
              )}
              {isRegularUser && (
                <>
                  <Link
                    to="/user/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
                    style={{ color: "var(--theme-badge-text, #81c784)", border: "1px solid var(--p-35)", textDecoration: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-12)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <LayoutDashboard size={14} />
                    <span>لوحتي</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{ color: "#ef9a9a", border: "1px solid rgba(198,40,40,0.2)" }}
                  >
                    <LogOut size={14} />
                    <span>خروج</span>
                  </button>
                </>
              )}
              {isAdmin && (
                // Admin has separate UI, show nothing in public nav
                null
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg transition-all duration-200"
              style={{
                color: "var(--theme-text-secondary, #a5d6a7)",
                background: mobileMenuOpen ? "var(--p-20)" : "transparent",
                border: "1px solid var(--p-30)",
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
              style={{ borderTop: "1px solid var(--p-20)", paddingTop: "0.75rem" }}
            >
              {navLinks.map((link, i) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-4 py-2.5 rounded-lg transition-all duration-200 animate-slide-in-right"
                    style={{
                      color: isActive ? "var(--theme-accent, #00a355)" : "var(--theme-text-secondary, #a5d6a7)",
                      background: isActive ? "var(--p-15)" : "transparent",
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
              {/* Mobile auth */}
              <div className="mt-2 pt-2 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--p-15)" }}>
                {isLoggedOut && (
                  <>
                    <Link to="/login" className="px-4 py-2.5 rounded-lg text-sm text-center" style={{ color: "var(--theme-badge-text, #81c784)", border: "1px solid var(--p-30)", textDecoration: "none" }}>
                      دخول
                    </Link>
                    <Link to="/register" className="btn-dz px-4 py-2.5 rounded-lg text-sm text-center" style={{ textDecoration: "none" }}>
                      تسجيل
                    </Link>
                  </>
                )}
                {isRegularUser && (
                  <>
                    <Link to="/user/dashboard" className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" style={{ color: "var(--theme-badge-text, #81c784)", border: "1px solid var(--p-30)", textDecoration: "none" }}>
                      <LayoutDashboard size={14} />
                      <span>لوحتي</span>
                    </Link>
                    <button onClick={handleLogout} className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 w-full" style={{ color: "#ef9a9a", border: "1px solid rgba(198,40,40,0.2)" }}>
                      <LogOut size={14} />
                      <span>خروج</span>
                    </button>
                  </>
                )}
              </div>
            </nav>
          )}
        </div>

        {/* Bottom accent line */}
        <div
          className="h-px"
          style={{
            background: "linear-gradient(90deg, transparent, var(--p-40), transparent)",
          }}
        />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "linear-gradient(180deg, #0e0e0e 0%, #080808 100%)",
          borderTop: "1px solid var(--p-20)",
        }}
      >
        <div
          className="h-px mb-8"
          style={{
            background: "linear-gradient(90deg, transparent, var(--theme-primary, #006233), var(--theme-accent, #00a355), var(--theme-primary, #006233), transparent)",
          }}
        />
        <div className="container mx-auto px-4 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="p-1.5 rounded-md"
              style={{ background: "linear-gradient(135deg, var(--theme-primary, #006233), color-mix(in srgb, var(--theme-primary, #006233) 70%, #ffffff))" }}
            >
              <Radio size={14} color="#ffffff" />
            </div>
            <span
              className="font-bold text-lg"
              style={{
                background: "linear-gradient(90deg, var(--theme-accent, #00a355), color-mix(in srgb, var(--theme-accent, #00a355) 70%, #ffffff))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              سند
            </span>
          </div>
          <p style={{ color: "var(--theme-text-secondary, #6aad6a)" }} className="mb-1 text-sm">
            المنصة الجزائرية الشاملة لمجال الإعلام
          </p>
          <p style={{ color: "var(--theme-text-dim, #3a5e3a)" }} className="text-xs">
            جميع الحقوق محفوظة © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
