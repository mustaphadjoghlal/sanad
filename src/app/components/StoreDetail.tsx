import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, MessageCircle } from "lucide-react";
import { getUserProfile } from "../../lib/firestore";
import type { UserProfile } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

type StoreProfile = UserProfile & { whatsapp?: string };

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle(
    store?.name ?? "",
    store ? `${store.name} — متجر ${store.specialty ?? "معدات إعلامية"} في ${store.location ?? "الجزائر"}` : undefined
  );

  useEffect(() => {
    if (!id) return;
    getUserProfile(id).then((p) => {
      setStore(p as StoreProfile);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</span>
      </div>
    );
  }

  if (!store || store.status !== "approved" || store.type !== "store") {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "1.25rem" }}>المتجر غير موجود</span>
        <Link to="/stores" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>← العودة إلى دليل المتاجر</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Link
          to="/stores"
          className="inline-flex items-center gap-2 mb-8 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
        >
          <ArrowRight size={16} />
          دليل المتاجر
        </Link>

        {/* Header */}
        <div className="flex items-center gap-5 mb-6">
          {store.photo ? (
            <img
              src={store.photo}
              alt={store.name}
              className="rounded-xl object-cover flex-shrink-0"
              style={{ width: 80, height: 80, border: "1px solid var(--p-20)" }}
            />
          ) : (
            <div
              className="rounded-xl flex-shrink-0 flex items-center justify-center text-3xl"
              style={{ width: 80, height: 80, background: "var(--p-20)" }}
            >
              🏪
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--theme-text, #e8f5e9)" }}>{store.name}</h1>
            {store.storeStatus && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: store.storeStatus === "paid" ? "rgba(0,80,40,0.3)" : "rgba(100,100,0,0.3)",
                  color: store.storeStatus === "paid" ? "#66bb6a" : "#e6c619",
                }}
              >
                {store.storeStatus === "paid" ? "متجر موثّق" : "تجريبي"}
              </span>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {store.specialty && (
            <div className="rounded-xl p-3" style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>نوع المعدات</div>
              <div className="text-sm font-medium" style={{ color: "var(--theme-text, #e8f5e9)" }}>{store.specialty}</div>
            </div>
          )}
          {store.location && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}>
              <MapPin size={14} style={{ color: "var(--theme-accent, #00a355)", flexShrink: 0 }} />
              <div>
                <div className="text-xs mb-0.5" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>الولاية</div>
                <div className="text-sm font-medium" style={{ color: "var(--theme-text, #e8f5e9)" }}>{store.location}</div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {store.bio && (
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>عن المتجر</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-secondary, #a5d6a7)", whiteSpace: "pre-wrap" }}>
              {store.bio}
            </p>
          </div>
        )}

        {/* Contact buttons */}
        {(store.phone || store.whatsapp) && (
          <div className="flex flex-wrap gap-3 mb-6">
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                style={{ background: "var(--p-15)", border: "1px solid var(--p-30)", color: "var(--theme-accent, #00a355)", textDecoration: "none" }}
              >
                <Phone size={15} />
                اتصل بنا
              </a>
            )}
            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366", textDecoration: "none" }}
              >
                <MessageCircle size={15} />
                واتساب
              </a>
            )}
          </div>
        )}

        <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--p-15)" }}>
          <Link to="/stores" className="text-sm transition-opacity hover:opacity-70" style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}>
            ← متاجر أخرى
          </Link>
        </div>
      </div>
    </div>
  );
}
