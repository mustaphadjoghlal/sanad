import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Tag, Package } from "lucide-react";
import { getProduct, addOrder } from "../../lib/firestore";
import type { Product } from "../../lib/types";
import { WILAYAS } from "../../lib/algeria";

const S = {
  input: {
    background: "#161616",
    border: "1px solid var(--p-30)",
    color: "var(--theme-text, #e8f5e9)",
    borderRadius: "0.5rem",
    padding: "0.6rem 0.85rem",
    width: "100%",
    fontSize: "0.875rem",
  } as React.CSSProperties,
  label: {
    color: "var(--theme-text-secondary, #a5d6a7)",
    fontSize: "0.8rem",
    display: "block",
    marginBottom: "0.35rem",
  } as React.CSSProperties,
};

type OrderForm = {
  buyerFirstName: string;
  buyerLastName: string;
  wilaya: string;
  city: string;
  quantity: number;
  note: string;
};

const emptyForm = (maxQty: number): OrderForm => ({
  buyerFirstName: "",
  buyerLastName: "",
  wilaya: "",
  city: "",
  quantity: 1,
  note: "",
});

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<OrderForm>(emptyForm(1));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getProduct(id).then((p) => {
      setProduct(p);
      if (p?.image) setMainImage(p.image);
      if (p) setForm(emptyForm(p.quantity));
      setLoading(false);
    });
  }, [id]);

  const sf = (field: keyof OrderForm, value: string | number) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!form.buyerFirstName.trim() || !form.buyerLastName.trim() || !form.wilaya || !form.city.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await addOrder({
        productId: product.id,
        productName: product.name,
        storeId: product.storeId,
        buyerFirstName: form.buyerFirstName.trim(),
        buyerLastName: form.buyerLastName.trim(),
        wilaya: form.wilaya,
        city: form.city.trim(),
        quantity: form.quantity,
        note: form.note.trim() || undefined,
        status: "pending",
      });
      setSuccess(true);
      setForm(emptyForm(product.quantity));
    } catch (err) {
      setError("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</span>
      </div>
    );
  }

  if (!product || product.status !== "active") {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "1.25rem" }}>المنتج غير موجود</span>
        <Link to="/stores" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>← العودة إلى دليل المتاجر</Link>
      </div>
    );
  }

  const allImages = [product.image, ...(product.contentImages ?? [])].filter(Boolean) as string[];

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Back link */}
        <Link
          to={`/stores/${product.storeId}`}
          className="inline-flex items-center gap-2 mb-8 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
        >
          <ArrowRight size={16} />
          العودة إلى المتجر
        </Link>

        {/* Main image */}
        {mainImage && (
          <div style={{ borderRadius: "1rem", overflow: "hidden", marginBottom: "1rem", border: "1px solid var(--p-20)" }}>
            <img
              src={mainImage}
              alt={product.name}
              style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImage(img)}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  border: mainImage === img ? "2px solid var(--theme-accent, #00a355)" : "1px solid var(--p-20)",
                  padding: 0,
                  cursor: "pointer",
                  background: "none",
                }}
              >
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}

        {/* Product info */}
        <div
          style={{
            background: "linear-gradient(145deg, #141414, #101010)",
            border: "1px solid var(--p-20)",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h1 style={{ color: "var(--theme-text, #e8f5e9)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            {product.name}
          </h1>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "rgba(0,163,85,0.15)",
                color: "var(--theme-accent, #00a355)",
                border: "1px solid rgba(0,163,85,0.3)",
                borderRadius: "9999px",
                padding: "0.2rem 0.75rem",
                fontSize: "0.85rem",
              }}
            >
              <Tag size={13} />
              {product.category}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "var(--p-10)",
                color: "var(--theme-text-secondary, #a5d6a7)",
                border: "1px solid var(--p-20)",
                borderRadius: "9999px",
                padding: "0.2rem 0.75rem",
                fontSize: "0.85rem",
              }}
            >
              <Package size={13} />
              {product.quantity} متوفر
            </span>
          </div>

          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--theme-accent, #00a355)", marginBottom: "1rem" }}>
            {product.price.toLocaleString()} دج
          </div>

          {product.description && (
            <p style={{ color: "var(--theme-text-secondary, #a5d6a7)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {product.description}
            </p>
          )}
        </div>

        {/* Order form */}
        <div
          style={{
            background: "linear-gradient(145deg, #141414, #101010)",
            border: "1px solid var(--p-20)",
            borderRadius: "1rem",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <ShoppingBag size={18} style={{ color: "var(--theme-accent, #00a355)" }} />
            <h2 style={{ color: "var(--theme-text, #e8f5e9)", fontWeight: 600, fontSize: "1.1rem" }}>طلب الشراء</h2>
          </div>

          {success ? (
            <div
              style={{
                background: "rgba(0,163,85,0.15)",
                border: "1px solid rgba(0,163,85,0.3)",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                color: "var(--theme-accent, #00a355)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✓</div>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>تم إرسال طلبك بنجاح!</div>
              <div style={{ fontSize: "0.875rem", color: "var(--theme-text-secondary, #a5d6a7)" }}>سيتواصل معك المتجر قريباً.</div>
              <button
                onClick={() => setSuccess(false)}
                style={{
                  marginTop: "1rem",
                  background: "rgba(0,163,85,0.2)",
                  border: "1px solid rgba(0,163,85,0.4)",
                  color: "var(--theme-accent, #00a355)",
                  borderRadius: "0.5rem",
                  padding: "0.4rem 1.25rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                إرسال طلب آخر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={S.label}>الاسم *</label>
                  <input
                    style={S.input}
                    value={form.buyerFirstName}
                    onChange={(e) => sf("buyerFirstName", e.target.value)}
                    placeholder="الاسم الأول"
                    required
                  />
                </div>
                <div>
                  <label style={S.label}>اللقب *</label>
                  <input
                    style={S.input}
                    value={form.buyerLastName}
                    onChange={(e) => sf("buyerLastName", e.target.value)}
                    placeholder="اللقب"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={S.label}>الولاية *</label>
                  <select
                    style={S.input}
                    value={form.wilaya}
                    onChange={(e) => sf("wilaya", e.target.value)}
                    required
                  >
                    <option value="">اختر الولاية</option>
                    {WILAYAS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label}>المدينة/البلدية *</label>
                  <input
                    style={S.input}
                    value={form.city}
                    onChange={(e) => sf("city", e.target.value)}
                    placeholder="اسم البلدية"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={S.label}>الكمية</label>
                <input
                  type="number"
                  style={{ ...S.input, width: "120px" }}
                  value={form.quantity}
                  min={1}
                  max={product.quantity}
                  onChange={(e) => sf("quantity", Math.max(1, Math.min(product.quantity, Number(e.target.value))))}
                />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={S.label}>ملاحظة (اختياري)</label>
                <textarea
                  style={{ ...S.input, minHeight: "80px", resize: "vertical" }}
                  value={form.note}
                  onChange={(e) => sf("note", e.target.value)}
                  placeholder="أي تفاصيل إضافية..."
                />
              </div>

              {error && (
                <div
                  style={{
                    background: "rgba(198,40,40,0.1)",
                    border: "1px solid rgba(198,40,40,0.3)",
                    borderRadius: "0.5rem",
                    padding: "0.65rem 1rem",
                    color: "#f87171",
                    fontSize: "0.875rem",
                    marginBottom: "1rem",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: "var(--theme-accent, #00a355)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.65rem",
                  padding: "0.75rem 2rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
