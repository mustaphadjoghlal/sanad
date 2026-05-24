import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Phone, MessageCircle, BadgeCheck, MapPin, Tag } from "lucide-react";
import { getUserProfile, subscribeToActiveStoreProducts } from "../../lib/firestore";
import type { UserProfile, Product } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

type StoreProfile = UserProfile & { whatsapp?: string };

const L = {
  page:    { background: "#f5f6fa", minHeight: "100vh" },
  card:    { background: "#ffffff", border: "1px solid #e8eaed", borderRadius: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  text:    { color: "#1a1a2e" },
  muted:   { color: "#6b7280" },
  accent:  "#006233",
  accentL: "#00a355",
  border:  "#e8eaed",
};

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("الكل");

  usePageTitle(
    store?.name ?? "",
    store ? `${store.name} — متجر ${store.specialty ?? "معدات إعلامية"} في ${store.location ?? "الجزائر"}` : undefined
  );

  useEffect(() => {
    if (!id) return;
    getUserProfile(id).then((p) => { setStore(p as StoreProfile); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    return subscribeToActiveStoreProducts(id, setProducts);
  }, [id]);

  const categories = ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = activeCategory === "الكل" ? products : products.filter((p) => p.category === activeCategory);

  if (loading) {
    return (
      <div style={{ ...L.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={L.muted}>جاري التحميل...</span>
      </div>
    );
  }

  if (!store || store.status !== "approved" || store.type !== "store") {
    return (
      <div style={{ ...L.page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <span style={{ ...L.muted, fontSize: "1.25rem" }}>المتجر غير موجود</span>
        <Link to="/stores" style={{ color: L.accentL, textDecoration: "none" }}>← العودة إلى سوق المعدات</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" style={L.page}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${L.border}` }}>
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <Link
            to="/stores"
            className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: L.muted.color, textDecoration: "none" }}
          >
            <ArrowRight size={15} />
            سوق المعدات
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Store header card */}
        <div className="mb-6" style={{ ...L.card, overflow: "hidden" }}>
          {/* Green accent top bar */}
          <div style={{ height: "5px", background: `linear-gradient(90deg, ${L.accent}, ${L.accentL})` }} />

          <div className="p-6 flex items-start gap-5 flex-wrap">
            {/* Logo */}
            {store.photo ? (
              <img
                src={store.photo}
                alt={store.name}
                style={{ width: 80, height: 80, borderRadius: "1rem", objectFit: "cover", border: `2px solid ${L.border}`, flexShrink: 0 }}
              />
            ) : (
              <div
                style={{ width: 80, height: 80, borderRadius: "1rem", background: "#f0faf4", border: `2px solid #d1fae5`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0 }}
              >
                🏪
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 style={{ ...L.text, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{store.name}</h1>
                {store.storeStatus === "paid" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "#f0fdf4", border: "1px solid #86efac", color: L.accent, fontSize: "0.72rem", padding: "0.15rem 0.6rem", borderRadius: "9999px", fontWeight: 600 }}>
                    <BadgeCheck size={11} /> موثّق
                  </span>
                )}
              </div>

              {store.specialty && (
                <div className="flex items-center gap-1.5 mb-2" style={{ color: L.muted.color, fontSize: "0.875rem" }}>
                  <Tag size={13} />
                  {store.specialty}
                </div>
              )}
              {store.location && (
                <div className="flex items-center gap-1.5 mb-3" style={{ color: L.muted.color, fontSize: "0.875rem" }}>
                  <MapPin size={13} />
                  {store.location}
                </div>
              )}
              {store.bio && (
                <p style={{ color: "#374151", fontSize: "0.875rem", lineHeight: 1.7, margin: "0 0 1rem", whiteSpace: "pre-wrap" }}>
                  {store.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#f0fdf4", border: `1px solid #86efac`, color: L.accent, textDecoration: "none", borderRadius: "0.6rem", padding: "0.45rem 1rem", fontSize: "0.85rem", fontWeight: 500 }}
                  >
                    <Phone size={14} /> اتصل بنا
                  </a>
                )}
                {store.whatsapp && (
                  <a
                    href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a", textDecoration: "none", borderRadius: "0.6rem", padding: "0.45rem 1rem", fontSize: "0.85rem", fontWeight: 500 }}
                  >
                    <MessageCircle size={14} /> واتساب
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products section */}
        {products.length === 0 ? (
          <div style={{ ...L.card, padding: "3rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📦</div>
            <p style={L.muted}>لا توجد منتجات متاحة حالياً</p>
          </div>
        ) : (
          <>
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background: activeCategory === cat ? L.accent : "#fff",
                    color: activeCategory === cat ? "#fff" : "#374151",
                    border: activeCategory === cat ? `1px solid ${L.accent}` : `1px solid ${L.border}`,
                    borderRadius: "9999px",
                    padding: "0.35rem 0.9rem",
                    fontSize: "0.82rem",
                    fontWeight: activeCategory === cat ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: activeCategory === cat ? "0 2px 8px rgba(0,98,51,0.2)" : "none",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {filtered.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{ ...L.card, overflow: "hidden", transition: "box-shadow 0.2s, transform 0.2s", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: 160, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>📷</div>
                    )}
                    <div style={{ padding: "0.85rem" }}>
                      <p style={{ ...L.text, fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.35rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ color: L.accentL, fontWeight: 700, fontSize: "1rem", marginBottom: "0.35rem" }}>
                        {p.price.toLocaleString("ar-DZ")} دج
                      </p>
                      <div className="flex items-center justify-between">
                        <span style={{ background: "#f3f4f6", color: "#6b7280", fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>{p.category}</span>
                        {p.quantity > 0 ? (
                          <span style={{ color: L.accent, fontSize: "0.7rem", fontWeight: 500 }}>متوفر ({p.quantity})</span>
                        ) : (
                          <span style={{ color: "#ef4444", fontSize: "0.7rem" }}>نفذ</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
