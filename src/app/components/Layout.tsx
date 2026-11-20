import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, Bell, BellOff, ChevronDown, Facebook, Instagram, Search, Home as HomeIcon, Newspaper, BookOpen, Camera, Briefcase, Trophy, Users, GraduationCap, Tv, FileText, Store, LogIn, UserPlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DropdownMenu, Popover, VisuallyHidden } from "radix-ui";
import { onAuthStateChanged } from "firebase/auth";
import { auth, getMessagingInstance, FCM_VAPID_KEY, ADMIN_EMAIL, FCM_SW_URL, FCM_SW_SCOPE } from "../../lib/firebase";
import { subscribeToUserProfile, subscribeToNotifications, markAllNotificationsRead, saveAdminFCMToken, saveUserFCMToken } from "../../lib/firestore";
import type { UserProfile, AppNotification } from "../../lib/types";
import { useLogoutFlow } from "./LogoutConfirm";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /**
   * undefined until Firebase has looked, then the account or null.
   *
   * It used to start at null, which the header read as "signed out" — so a
   * signed-in visitor was shown دخول and تسجيل for the moment before the
   * session came back from storage. The same two-state assumption is what
   * showed the login form to someone already signed in, so here it is spelled
   * out: not knowing yet is its own state, and nothing decides anything from
   * it.
   */
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string | null } | null | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null | "admin">(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const prevNotifCountRef = useRef(0);
  // What to tell the visitor after they asked for notifications.
  const [notifHint, setNotifHint] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "الرئيسية", icon: HomeIcon },
    { to: "/news", label: "أخبار", icon: Newspaper },
    { to: "/courses", label: "الدورات", icon: BookOpen },
    { to: "/equipment", label: "العتاد", icon: Camera },
    { to: "/jobs", label: "التوظيف", icon: Briefcase },
    { to: "/competitions", label: "المسابقات", icon: Trophy },
  ];

  const moreLinks = [
    { to: "/professionals", label: "دليل المحترفين", icon: Users },
    { to: "/trainers", label: "مراكز التدريب", icon: GraduationCap },
    { to: "/channels", label: "دليل القنوات", icon: Tv },
    { to: "/theses", label: "مذكرات التخرج", icon: FileText },
    { to: "/stores", label: "سوق المعدات", icon: Store },
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
      setCurrentUser(user ? { uid: user.uid, email: user.email } : null);
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
    const unsub = subscribeToUserProfile(
      currentUser.uid,
      (profile) => setUserProfile(profile ?? null),
      () => setUserProfile(null)
    );
    return unsub;
  }, [currentUser]);

  // Subscribe to notifications for logged-in users
  useEffect(() => {
    if (!currentUser) { setNotifications([]); prevNotifCountRef.current = 0; return; }
    const isAdminUser = currentUser.email === ADMIN_EMAIL;
    // No OS notification is raised here: FCM already delivers one for the same
    // event, and firing a second from this listener showed every foreground
    // user the same notification twice.
    const unsub = subscribeToNotifications(
      isAdminUser,
      (notifs) => {
        prevNotifCountRef.current = notifs.length;
        setNotifications(notifs);
      },
      () => setNotifications([])
    );
    return unsub;
  }, [currentUser]);

  // Register the FCM token once the visitor has granted permission. Permission
  // itself is never requested here: an unprompted popup on page load is what
  // browsers penalise, so it is asked for behind the bell's explicit button.
  useEffect(() => {
    if (!currentUser || userProfile === null) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission !== "granted") return;

    let cancelled = false;

    const init = async () => {
      try {
        if (!FCM_VAPID_KEY) {
          console.warn("FCM_VAPID_KEY is missing — push notifications disabled");
          return;
        }

        // The messaging worker gets its own scope. Registering it at "/" would
        // fight the PWA worker for that scope, and each would silently evict
        // the other on every page load.
        const sw = await navigator.serviceWorker.register(
          `${FCM_SW_URL}&v=1`,
          { scope: FCM_SW_SCOPE }
        );
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        const messaging = await getMessagingInstance();
        if (!messaging || cancelled) return;

        const { getToken, onMessage } = await import("firebase/messaging");
        const token = await getToken(messaging, { vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: sw });
        if (cancelled) return;

        if (token) {
          if (userProfile === "admin") {
            await saveAdminFCMToken(token);
          } else {
            await saveUserFCMToken(currentUser.uid, token);
          }
        }

        onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? "سند";
          const body = payload.notification?.body ?? "";
          // Going through the worker keeps foreground and background
          // notifications identical, and works where the Notification
          // constructor is unavailable (Android Chrome).
          sw.showNotification(title, {
            body,
            icon: "/icon-192.png",
            dir: "rtl",
            lang: "ar",
            tag: "sanad-notif-" + Date.now(),
            data: payload.data,
          }).catch(() => {
            if (Notification.permission === "granted") {
              new Notification(title, { body, icon: "/icon-192.png", dir: "rtl", lang: "ar" });
            }
          });
        });
      } catch (err) {
        console.error("FCM registration error:", err);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [currentUser, userProfile, notifPermission]);

  // Radix closes the menus on outside click and Escape; a route change has to
  // close the notifications list too, since a notification link navigates.
  useEffect(() => { setNotifOpen(false); }, [location.pathname]);

  // All four logout buttons in this header share the one confirm flow.
  const { requestLogout, dialog: logoutDialog } = useLogoutFlow();

  /**
   * Asked for only on an explicit click — the registration effect above picks
   * it up through `notifPermission`, so no page reload is needed.
   *
   * It used to call and say nothing, whatever came back. Edge and Chrome both
   * ship a "quieter notification requests" setting that shows no dialog at
   * all: the call resolves as still-undecided, or never resolves, and a bell
   * appears in the address bar instead. Clicking the button then did
   * precisely nothing visible, which is indistinguishable from a broken
   * button — and that is what it was reported as.
   */
  const requestNotifPermission = async () => {
    if (!("Notification" in window)) {
      setNotifHint("متصفّحك لا يدعم إشعارات الويب.");
      return;
    }
    setNotifHint(null);

    // If the browser suppresses the prompt the promise can hang; the hint
    // must appear anyway.
    const decided = await Promise.race([
      Notification.requestPermission(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);

    const permission = decided ?? Notification.permission;
    setNotifPermission(permission);

    if (permission === "granted") {
      setNotifHint("✓ فُعّلت التنبيهات.");
      setTimeout(() => setNotifHint(null), 4000);
    } else if (permission === "denied") {
      setNotifHint("الإشعارات محظورة لهذا الموقع. غيّرها من أيقونة القفل بجانب شريط العنوان ← الإشعارات ← سماح.");
    } else {
      // Still undecided: the prompt was dismissed, or the browser never showed
      // one. Either way the address bar is where it can be allowed.
      setNotifHint("لم يُظهر المتصفّح نافذة الإذن. اضغط أيقونة القفل أو الجرس بجانب شريط العنوان ← الإشعارات ← سماح.");
    }
  };

  const isRegularUser = userProfile && userProfile !== "admin";
  const isAdmin = userProfile === "admin" && currentUser;
  const authResolved = currentUser !== undefined;
  const isLoggedOut = currentUser === null;
  const unreadCount = currentUser
    ? notifications.filter((n) => !n.readBy?.includes(currentUser.uid)).length
    : 0;

  const isActivePath = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));
  const moreActive = moreLinks.some((l) => isActivePath(l.to));

  const openNotifications = (open: boolean) => {
    setNotifOpen(open);
    if (open && unreadCount > 0 && currentUser) {
      markAllNotificationsRead(notifications.map((n) => n.id), currentUser.uid);
    }
  };

  return (
    <div className="min-h-screen flex flex-col brand" dir="rtl" style={{ background: "var(--b-ink)" }}>
      <a href="#main-content" className="skip-link">تخطَّ إلى المحتوى</a>

      {/* What the browser answered when notifications were asked for. Shown
          under the header because the answer is often "I showed you nothing",
          and silence there is what made the button look broken. */}
      {notifHint && (
        <div
          role="status"
          className="px-4 py-2.5 text-sm text-center"
          style={{
            background: notifHint.startsWith("✓") ? "rgba(15,166,89,0.14)" : "rgba(180,120,0,0.14)",
            color: notifHint.startsWith("✓") ? "#4ade80" : "#fbbf24",
            borderBottom: "1px solid var(--b-line)",
            lineHeight: 1.9,
          }}
        >
          {notifHint}
          <button
            type="button"
            onClick={() => setNotifHint(null)}
            aria-label="إخفاء"
            style={{ marginInlineStart: "0.75rem", background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="b-header sticky top-0 z-50" data-scrolled={scrolled}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-3 h-16">
            <Link to="/" className="flex items-center shrink-0" style={{ textDecoration: "none" }}>
              <img
                src="/logo.png"
                width={133}
                height={40}
                alt="سند — المنصة الجزائرية الإعلامية الشاملة"
                className="h-9 md:h-10 w-auto"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5" aria-label="القائمة الرئيسية">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="b-nav-link"
                  aria-current={isActivePath(link.to) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ))}

              <DropdownMenu.Root modal={false} dir="rtl">
                <DropdownMenu.Trigger className="b-nav-link" data-active={moreActive}>
                  المزيد
                  <ChevronDown size={14} aria-hidden="true" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="b-pop b-menu brand" align="start" sideOffset={8}>
                    {moreLinks.map((link) => (
                      <DropdownMenu.Item key={link.to} asChild>
                        <Link to={link.to} className="b-menu-item" aria-current={isActivePath(link.to) ? "page" : undefined}>
                          <link.icon size={16} aria-hidden="true" />
                          {link.label}
                        </Link>
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/search" aria-label="البحث في الموقع" className="b-icon-btn hidden sm:inline-flex">
                <Search size={17} />
              </Link>

              {/* Desktop account actions */}
              <div className="hidden lg:flex items-center gap-2">
                {currentUser && notifPermission === "default" && (
                  <button type="button" onClick={requestNotifPermission} className="b-btn b-btn--primary b-btn--sm">
                    <Bell size={14} aria-hidden="true" />
                    تفعيل التنبيهات
                  </button>
                )}
                {/* Blocked used to look exactly like working: someone who once
                    pressed "Block" saw a clean header and waited for
                    notifications that could never arrive. */}
                {currentUser && notifPermission === "denied" && (
                  <span
                    title="الإشعارات محظورة لهذا الموقع — غيّرها من القفل بجانب شريط العنوان"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                    style={{ color: "#f87171", background: "rgba(198,40,40,0.14)", border: "1px solid rgba(198,40,40,0.3)" }}
                  >
                    <BellOff size={14} aria-hidden="true" />
                    التنبيهات محظورة
                  </span>
                )}
                {/* Holds the row's width so the header does not jump when the
                    answer arrives. */}
                {!authResolved && <span aria-hidden="true" style={{ display: "inline-block", width: "8.5rem", height: "2.25rem" }} />}
                {isLoggedOut && (
                  <>
                    <Link to="/login" className="b-btn b-btn--ghost b-btn--sm">دخول</Link>
                    <Link to="/register" className="b-btn b-btn--primary b-btn--sm">تسجيل</Link>
                  </>
                )}
                {isRegularUser && (
                  <Link to="/user/dashboard" className="b-btn b-btn--ghost b-btn--sm">
                    <LayoutDashboard size={15} aria-hidden="true" />
                    لوحتي
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/sanad-admin/dashboard" className="b-btn b-btn--ghost b-btn--sm" style={{ color: "#ffd54f", borderColor: "rgba(255,213,79,0.3)" }}>
                    <LayoutDashboard size={15} aria-hidden="true" />
                    لوحة الأدمن
                  </Link>
                )}
                {(isRegularUser || isAdmin) && (
                  <button type="button" onClick={requestLogout} aria-label="تسجيل الخروج" className="b-icon-btn" style={{ color: "#ef9a9a" }}>
                    <LogOut size={16} />
                  </button>
                )}
              </div>

              {/* Notifications */}
              {currentUser && (
                <Popover.Root open={notifOpen} onOpenChange={openNotifications}>
                  <Popover.Trigger
                    className="b-icon-btn"
                    aria-label={unreadCount > 0 ? `الإشعارات (${unreadCount} غير مقروء)` : "الإشعارات"}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-1.5 -left-1.5 min-w-[19px] h-[19px] rounded-full flex items-center justify-center font-bold"
                        style={{ background: "var(--b-green)", color: "var(--b-on-green)", fontSize: "0.65rem", padding: "0 4px", border: "2px solid var(--b-ink)" }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="b-pop brand overflow-hidden"
                      align="end"
                      sideOffset={10}
                      collisionPadding={8}
                      dir="rtl"
                      style={{ width: "min(calc(100vw - 16px), 24rem)" }}
                    >
                      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--b-line)" }}>
                        <span className="font-bold text-sm">الإشعارات</span>
                        <Popover.Close className="b-icon-btn" aria-label="إغلاق" style={{ width: "2rem", height: "2rem" }}>
                          <X size={15} />
                        </Popover.Close>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center text-sm" style={{ color: "var(--b-text-3)" }}>لا توجد إشعارات</div>
                        ) : (
                          notifications.map((n) => {
                            const isUnread = !n.readBy?.includes(currentUser.uid);
                            const inner = (
                              <div
                                className="px-4 py-3 flex items-start gap-2.5"
                                style={{ borderBottom: "1px solid var(--b-line)", background: isUnread ? "var(--b-green-08)" : "transparent" }}
                              >
                                <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: isUnread ? "var(--b-green)" : "transparent" }} />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold" style={{ color: "var(--b-text)" }}>{n.title}</p>
                                  <p className="text-xs mt-1" style={{ color: "var(--b-text-2)", lineHeight: 1.7 }}>{n.body}</p>
                                  <p className="text-[0.7rem] mt-1.5" style={{ color: "var(--b-text-3)" }}>
                                    {new Date(n.createdAt).toLocaleDateString("ar-DZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                            );
                            return n.link ? (
                              <Link key={n.id} to={n.link} className="block hover:bg-white/[0.03]" style={{ textDecoration: "none" }}>
                                {inner}
                              </Link>
                            ) : (
                              <div key={n.id}>{inner}</div>
                            );
                          })
                        )}
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              )}

              {/* Mobile menu: a drawer from the right, with focus trapped
                  inside and the page behind it locked. */}
              <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <Dialog.Trigger className="b-icon-btn lg:hidden" aria-label="فتح القائمة">
                  <Menu size={20} />
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="b-overlay" />
                  <Dialog.Content className="b-drawer brand" dir="rtl" aria-describedby={undefined}>
                    <VisuallyHidden.Root><Dialog.Title>القائمة</Dialog.Title></VisuallyHidden.Root>
                    <div className="flex items-center justify-between px-4 h-16 shrink-0" style={{ borderBottom: "1px solid var(--b-line)" }}>
                      <img src="/logo.png" alt="سند" width={120} height={36} className="h-9 w-auto" />
                      <Dialog.Close className="b-icon-btn" aria-label="إغلاق القائمة">
                        <X size={20} />
                      </Dialog.Close>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5" aria-label="القائمة الرئيسية">
                      <Link to="/search" className="b-drawer-link mb-2" style={{ border: "1px solid var(--b-line-strong)" }}>
                        <Search size={18} aria-hidden="true" />
                        <span style={{ color: "var(--b-text-3)" }}>ابحث في سند…</span>
                      </Link>
                      {navLinks.map((link) => (
                        <Link key={link.to} to={link.to} className="b-drawer-link" aria-current={isActivePath(link.to) ? "page" : undefined}>
                          <link.icon size={18} aria-hidden="true" />
                          {link.label}
                        </Link>
                      ))}
                      <p className="px-3 pt-4 pb-1.5 text-xs font-bold" style={{ color: "var(--b-text-3)" }}>أدلّة وخدمات</p>
                      {moreLinks.map((link) => (
                        <Link key={link.to} to={link.to} className="b-drawer-link" aria-current={isActivePath(link.to) ? "page" : undefined}>
                          <link.icon size={18} aria-hidden="true" />
                          {link.label}
                        </Link>
                      ))}
                    </nav>

                    <div className="p-3 flex flex-col gap-2 shrink-0" style={{ borderTop: "1px solid var(--b-line)" }}>
                      {/* Enabling notifications used to be desktop-only, so on
                          a phone there was no way to turn them on at all. */}
                      {currentUser && notifPermission === "default" && (
                        <button type="button" onClick={() => { requestNotifPermission(); setMobileMenuOpen(false); }} className="b-btn b-btn--primary w-full">
                          <Bell size={16} aria-hidden="true" />
                          تفعيل التنبيهات
                        </button>
                      )}
                      {currentUser && notifPermission === "denied" && (
                        <span className="px-3 py-2.5 rounded-xl text-sm flex items-center gap-2" style={{ color: "#f87171", background: "rgba(198,40,40,0.14)", border: "1px solid rgba(198,40,40,0.3)" }}>
                          <BellOff size={15} aria-hidden="true" />
                          التنبيهات محظورة — غيّرها من إعدادات المتصفح
                        </span>
                      )}
                      {isLoggedOut && (
                        <div className="grid grid-cols-2 gap-2">
                          <Link to="/login" className="b-btn b-btn--ghost"><LogIn size={16} aria-hidden="true" />دخول</Link>
                          <Link to="/register" className="b-btn b-btn--primary"><UserPlus size={16} aria-hidden="true" />تسجيل</Link>
                        </div>
                      )}
                      {(isRegularUser || isAdmin) && (
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            to={isAdmin ? "/sanad-admin/dashboard" : "/user/dashboard"}
                            className="b-btn b-btn--ghost"
                            style={isAdmin ? { color: "#ffd54f", borderColor: "rgba(255,213,79,0.3)" } : undefined}
                          >
                            <LayoutDashboard size={16} aria-hidden="true" />
                            {isAdmin ? "لوحة الأدمن" : "لوحتي"}
                          </Link>
                          <button type="button" onClick={() => { setMobileMenuOpen(false); requestLogout(); }} className="b-btn b-btn--ghost" style={{ color: "#ef9a9a", borderColor: "rgba(198,40,40,0.3)" }}>
                            <LogOut size={16} aria-hidden="true" />
                            خروج
                          </button>
                        </div>
                      )}
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--b-ink)", borderTop: "1px solid var(--b-line)" }}>
        <div className="container mx-auto px-4 py-10 flex flex-col items-center text-center gap-4">
          <img src="/logo.png" alt="سند" width={120} height={36} loading="lazy" decoding="async" className="h-9 w-auto" />
          <p className="text-sm" style={{ color: "var(--b-text-2)" }}>المنصة الجزائرية الشاملة لمجال الإعلام</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href="https://www.facebook.com/profile.php?id=61590628561028"
              target="_blank"
              rel="noopener noreferrer"
              className="b-btn b-btn--ghost b-btn--sm"
            >
              <Facebook size={15} aria-hidden="true" />
              فيسبوك
            </a>
            <a
              href="https://www.instagram.com/sanadzmedia"
              target="_blank"
              rel="noopener noreferrer"
              className="b-btn b-btn--ghost b-btn--sm"
            >
              <Instagram size={15} aria-hidden="true" />
              إنستغرام
            </a>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm" aria-label="روابط الموقع">
            {[
              { to: "/about", label: "من نحن" },
              { to: "/privacy", label: "الخصوصية" },
              { to: "/terms", label: "الشروط" },
              { to: "/search", label: "البحث" },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-white transition-colors" style={{ color: "var(--b-text-3)", textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs" style={{ color: "var(--b-text-3)" }}>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </footer>

      {logoutDialog}
    </div>
  );
}
