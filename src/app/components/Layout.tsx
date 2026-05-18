import { Link, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "الرئيسية" },
    { to: "/courses", label: "الدورات التدريبية" },
    { to: "/equipment", label: "متجر العتاد" },
    { to: "/jobs", label: "عروض التوظيف" },
    { to: "/competitions", label: "المسابقات" },
    { to: "/voice-requests", label: "طلبات المنشطين" },
  ];

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <header className="bg-emerald-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="font-bold text-2xl">
              سند
            </Link>

            <nav className="hidden md:flex gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="hover:text-emerald-200 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="hover:text-emerald-200 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">سند - المنصة الجزائرية الشاملة لمجال الإعلام</p>
          <p className="text-sm text-gray-400">جميع الحقوق محفوظة © 2026</p>
        </div>
      </footer>
    </div>
  );
}
