import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Phone, MessageCircle, BadgeCheck, Package } from "lucide-react";
import { getUserProfile, subscribeToActiveStoreProducts } from "../../lib/firestore";
import type { UserProfile, Product } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

type StoreProfile = UserProfile & { whatsapp?: string };

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
    getUserProfile(id).then((p) => {
      setStore(p as StoreProfile);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToActiveStoreProducts(id, (prods) => {
      setProducts(prods);
    });
    return unsub;
  }, [id]);

  const categories = ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    activeCategory === "الكل" ? products : products.filter((p) => p.category === activeCategory);

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
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <Link
          to="/stores"
          className="inline-flex items-center gap-2 mb-8 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
        >
          <ArrowRight size={16} />
          دليل المتاجر
        </Link>

        {/* Store header */}
        <div
          style={{
            background: "linear-gradient(145deg, #141414, #101010)",
            border: "1px solid var(--p-20)",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            {store.photo ? (
              <img
                src={store.photo}
                alt={store.name}
                style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--p-30)" }}
              />
            ) : (
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: "var(--p-20)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  border: "2px solid var(--p-30)",
                }}
              >
                🏪
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
              <h1 style={{ color: "var(--theme-text, #e8f5e9)", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
                {store.name}
              </h1>
              {store.storeStatus === "paid" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "rgba(0,163,85,0.15)", border: "1px solid rgba(0,163,85,0.3)", color: "var(--theme-accent, #00a355)", fontSize: "0.75rem", padding: "0.15rem 0.6rem", borderRadius: "9999px" }}>
                  <BadgeCheck size={12} />
                  متجر موثّق
                </span>
              )}
              {store.storeStatus === "trial" && (
                <span style={{ background: "rgba(180,120,0,0.2)", color: "#fbbf24", border: "1px solid rgba(180,120,0,0.3)", fontSize: "0.75rem", padding: "0.15rem 0.6rem", borderRadius: "9999px" }}>
                  تجريبي
                </span>
              )}
            </div>

            {store.specialty && (
              <div style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                {store.specialty}
              </div>
            )}

            {store.bio && (
              <p style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.875rem", lineHeight: 1.65, margin: "0 0 0.75rem", whiteSpace: "pre-wrap" }}>
                {store.bio}
              </p>
            )}

            {/* Contact buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "var(--p-15)", border: "1px solid var(--p-30)", color: "var(--theme-accent, #00a355)", textDecoration: "none", borderRadius: "0.65rem", padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                >
                  <Phone size={14} />
                  اتصل بنا
                </a>
              )}
              {(store as StoreProfile).whatsapp && (
                <a
                  href={`https://wa.me/${((store as StoreProfile).whatsapp ?? "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366", textDecoration: "none", borderRadius: "0.65rem", padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                >
                  <MessageCircle size={14} />
                  واتساب
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        {products.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? "rgba(0,163,85,0.2)" : "var(--p-10)",
                  border: activeCategory === cat ? "1px solid rgba(0,163,85,0.4)" : "1px solid var(--p-20)",
                  color: activeCategory === cat ? "var(--theme-accent, #00a355)" : "var(--theme-text-secondary, #a5d6a7)",
                  borderRadius: "9999px",
                  padding: "0.35rem 0.9rem",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        {filteredProducts.length === 0 ? (
          <div
            style={{
              background: "linear-gradient(145deg, #141414, #101010)",
              border: "1px solid var(--p-20)",
              borderRadius: "1rem",
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <Package size={36} style={{ color: "var(--theme-text-dim, #3a5e3a)", marginBottom: "1rem" }} />
            <div style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>لا توجد منتجات متاحة حالياً</div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "linear-gradient(145deg, #141414, #101010)",
                    border: "1px solid var(--p-20)",
                    borderRadius: "0.85rem",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                    height: "100%",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,163,85,0.35)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--p-20)"; }}
                >
                  {/* Product image */}
                  <div style={{ height: 160, background: "var(--p-10)", overflow: "hidden" }}>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Package size={32} style={{ color: "var(--theme-text-dim, #3a5e3a)" }} />
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div style={{ padding: "0.85rem" }}>
                    <div style={{ color: "var(--theme-text, #e8f5e9)", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.4rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {product.name}
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ background: "rgba(0,163,85,0.1)", color: "var(--theme-accent, #00a355)", border: "1px solid rgba(0,163,85,0.2)", fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                        {product.category}
                      </span>
                    </div>
                    <div style={{ color: "var(--theme-accent, #00a355)", fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>
                      {product.price.toLocaleString()} دج
                    </div>
                    <div style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.8rem", fontWeight: 500 }}>
                      عرض المنتج ←
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--p-15)", marginTop: "2.5rem" }}>
          <Link to="/stores" className="text-sm transition-opacity hover:opacity-70" style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}>
            ← متاجر أخرى
          </Link>
        </div>
      </div>
    </div>
  );
}
