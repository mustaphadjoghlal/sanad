import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Radio, LogOut, LayoutDashboard, Bell, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firebaseConfig, getMessagingInstance, FCM_VAPID_KEY, ADMIN_EMAIL } from "../../lib/firebase";
import { subscribeToUserProfile, subscribeToNotifications, markAllNotificationsRead, saveAdminFCMToken } from "../../lib/firestore";
import type { UserProfile, AppNotification } from "../../lib/types";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ uid: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null | "admin">(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const prevNotifCountRef = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/", label: "الرئيسية" },
    { to: "/news", label: "أخبار" },
    { to: "/courses", label: "الدورات" },
    { to: "/equipment", label: "العتاد" },
    { to: "/jobs", label: "التوظيف" },
    { to: "/competitions", label: "المسابقات" },
    { to: "/voice-requests", label: "المنشطون" },
  ];

  const moreLinks = [
    { to: "/channels", label: "دليل القنوات" },
    { to: "/theses", label: "مذكرات التخرج" },
    { to: "/stores", label: "سوق المعدات" },
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
    if (currentUser.email === ADMIN_EMAIL) {
      setUserProfile("admin");
      return;
    }
    const unsub = subscribeToUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile ?? null);
    });
    return unsub;
  }, [currentUser]);

  // Subscribe to notifications for logged-in users
  useEffect(() => {
    if (!currentUser) { setNotifications([]); prevNotifCountRef.current = 0; return; }
    const unsub = subscribeToNotifications((notifs) => {
      const prevCount = prevNotifCountRef.current;
      if (prevCount > 0 && notifs.length > prevCount) {
        const newest = notifs[0];
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(newest.title, { body: newest.body, icon: "/icon.svg", dir: "rtl", lang: "ar" });
        }
      }
      prevNotifCountRef.current = notifs.length;
      setNotifications(notifs);
    });
    return unsub;
  }, [currentUser]);

  // Request notification permission + register FCM token — only after userProfile is known
  useEffect(() => {
    if (!currentUser || userProfile === null) return;
    if (!("Notification" in window)) return;

    const init = async () => {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") return;

      try {
        const sw = await navigator.serviceWorker.ready;
        sw.active?.postMessage({ type: "FIREBASE_CONFIG", config: firebaseConfig });

        if (!FCM_VAPID_KEY) return;
        const messaging = await getMessagingInstance();
        if (!messaging) return;

        const { getToken, onMessage } = await import("firebase/messaging");
        const token = await getToken(messaging, { vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: sw });
        if (token) {
          if (userProfile === "admin") {
            const { setDoc, doc } = await import("firebase/firestore");
            const { db } = await import("../../lib/firebase");
            await setDoc(doc(db, "config", "adminFCM"), { token, updatedAt: Date.now() }, { merge: true });
          } else {
            await saveAdminFCMToken(token, currentUser?.uid);
          }
        }

        onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? "سند";
          const body = payload.notification?.body ?? "";
          new Notification(title, { body, icon: "/icon.svg", dir: "rtl", lang: "ar" });
        });
      } catch {
        // Silently ignore — FCM not configured yet
      }
    };

    init();
  }, [currentUser, userProfile]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const isRegularUser = userProfile && userProfile !== "admin";
  const isAdmin = userProfile === "admin" && currentUser;
  const isLoggedOut = !currentUser;
  const unreadCount = currentUser
    ? notifications.filter((n) => !n.readBy?.includes(currentUser.uid)).length
    : 0;

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
            <nav className="hidden md:flex gap-1 items-center">
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
                        style={{ background: "linear-gradient(90deg, transparent, var(--theme-accent, #00a355), transparent)" }}
                      />
                    )}
                  </Link>
                );
              })}

              {/* More dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen((o) => !o)}
                  className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-all duration-200"
                  style={{
                    color: moreLinks.some((l) => location.pathname.startsWith(l.to)) ? "var(--theme-accent, #00a355)" : "var(--theme-text-secondary, #a5d6a7)",
                    background: moreOpen ? "var(--p-15)" : "transparent",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-10)"; }}
                  onMouseLeave={(e) => { if (!moreOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  المزيد
                  <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: moreOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {moreOpen && (
                  <div
                    className="absolute top-full mt-1 animate-fade-in-down"
                    style={{
                      right: 0, minWidth: "160px", zIndex: 100,
                      background: "linear-gradient(145deg, #141414, #101010)",
                      border: "1px solid var(--p-30)",
                      borderRadius: "0.75rem",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                      overflow: "hidden",
                    }}
                  >
                    {moreLinks.map((link) => {
                      const isActive = location.pathname.startsWith(link.to);
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="block px-4 py-2.5 text-sm transition-colors"
                          style={{
                            color: isActive ? "var(--theme-accent, #00a355)" : "var(--theme-text-secondary, #a5d6a7)",
                            background: isActive ? "var(--p-12)" : "transparent",
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-10)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isActive ? "var(--p-12)" : "transparent"; }}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
                <>
                  <Link
                    to="/sanad-admin/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
                    style={{ color: "#ffd54f", border: "1px solid rgba(255,213,79,0.3)", textDecoration: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,213,79,0.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <LayoutDashboard size={14} />
                    <span>لوحة الأدمن</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{ color: "#ef9a9a", border: "1px solid rgba(198,40,40,0.2)" }}
                  >
                    <LogOut size={14} />
                  </button>
                </>
              )}
            </div>

            {/* Notification Bell */}
            {currentUser && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen((o) => !o);
                    if (!notifOpen && unreadCount > 0 && currentUser) {
                      markAllNotificationsRead(notifications.map((n) => n.id), currentUser.uid);
                    }
                  }}
                  className="relative p-2 rounded-lg transition-all duration-200"
                  style={{ color: "var(--theme-text-secondary)", border: "1px solid var(--p-25)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-12)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -left-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "var(--theme-accent)", color: "#fff", fontSize: "0.65rem", padding: "0 4px" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div
                    className="rounded-xl overflow-hidden animate-fade-in-down"
                    style={{
                      position: "fixed",
                      top: "72px",
                      left: "8px",
                      right: "8px",
                      zIndex: 200,
                      background: "var(--theme-bg-card, #141414)",
                      border: "1px solid var(--p-30)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--p-15)" }}>
                      <span className="font-semibold text-sm" style={{ color: "var(--theme-text)" }}>الإشعارات</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm" style={{ color: "var(--theme-text-muted)" }}>لا توجد إشعارات</div>
                      ) : (
                        notifications.map((n) => {
                          const isUnread = !n.readBy?.includes(currentUser.uid);
                          const inner = (
                            <div
                              className="px-4 py-3 transition-colors"
                              style={{ borderBottom: "1px solid var(--p-10)", background: isUnread ? "var(--p-08)" : "transparent", cursor: n.link ? "pointer" : "default" }}
                              onMouseEnter={(e) => { if (n.link) (e.currentTarget as HTMLElement).style.background = "var(--p-12)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isUnread ? "var(--p-08)" : "transparent"; }}
                            >
                              <div className="flex items-start gap-2">
                                {isUnread && <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--theme-accent)" }} />}
                                <div className={isUnread ? "" : "pr-4"}>
                                  <p className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>{n.title}</p>
                                  <p className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>{n.body}</p>
                                  <p className="text-xs mt-1" style={{ color: "var(--theme-text-dim)" }}>
                                    {new Date(n.createdAt).toLocaleDateString("ar-DZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                          return n.link ? (
                            <Link key={n.id} to={n.link} onClick={() => setNotifOpen(false)} style={{ textDecoration: "none", display: "block" }}>
                              {inner}
                            </Link>
                          ) : (
                            <div key={n.id}>{inner}</div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
              <div style={{ borderTop: "1px solid var(--p-12)", marginTop: "0.25rem", paddingTop: "0.25rem" }}>
                {moreLinks.map((link, i) => {
                  const isActive = location.pathname.startsWith(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="px-4 py-2.5 rounded-lg transition-all duration-200 animate-slide-in-right flex items-center gap-2"
                      style={{
                        color: isActive ? "var(--theme-accent, #00a355)" : "var(--theme-text-muted, #4a7a4a)",
                        background: isActive ? "var(--p-15)" : "transparent",
                        textDecoration: "none",
                        animationDelay: `${(navLinks.length + i) * 0.05}s`,
                        opacity: 0,
                        animationFillMode: "forwards",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>•</span>
                      {link.label}
                    </Link>
                  );
                })}
              </div>
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
                {isAdmin && (
                  <>
                    <Link to="/sanad-admin/dashboard" className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" style={{ color: "#ffd54f", border: "1px solid rgba(255,213,79,0.3)", textDecoration: "none" }}>
                      <LayoutDashboard size={14} />
                      <span>لوحة الأدمن</span>
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
