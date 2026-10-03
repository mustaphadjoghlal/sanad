import { useState, useEffect, useRef } from "react";
import { Plus, X, Pencil, Trash2, Package, ShoppingBag, Truck, Check } from "lucide-react";
import {
  subscribeToStoreProducts,
  subscribeToStoreOrders,
  addProduct,
  updateProduct,
  deleteProduct,
  updateOrder,
  setOrderStatus,
  saveUserProfile,
} from "../../lib/firestore";
import { storeStats, bestSellers, formatDinars, LOW_STOCK } from "../../lib/storeStats";
import { WILAYAS } from "../../lib/algeria";
import { uploadImage } from "../../lib/storage";
import type { UserProfile, Product, Order, OrderStatus, DeliveryZone } from "../../lib/types";
import { PRODUCT_CATEGORIES } from "../../lib/types";

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
  th: {
    padding: "0.7rem 1rem",
    textAlign: "right" as const,
    fontSize: "0.78rem",
    color: "var(--theme-text-dim, #3a5e3a)",
    borderBottom: "1px solid var(--p-20)",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "0.65rem 1rem",
    fontSize: "0.875rem",
    color: "var(--theme-text, #e8f5e9)",
    borderBottom: "1px solid var(--p-15)",
    verticalAlign: "middle" as const,
  },
  card: {
    background: "linear-gradient(145deg, #141414, #101010)",
    border: "1px solid var(--p-20)",
    borderRadius: "1rem",
    padding: "1.25rem",
  } as React.CSSProperties,
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  in_delivery: "في التوصيل",
  sold: "مباع",
  cancelled: "ملغى",
};

const ORDER_STATUS_COLORS: Record<OrderStatus, React.CSSProperties> = {
  pending: { background: "rgba(180,120,0,0.2)", color: "#fbbf24", border: "1px solid rgba(180,120,0,0.3)" },
  in_delivery: { background: "rgba(30,90,200,0.2)", color: "#60a5fa", border: "1px solid rgba(60,130,200,0.3)" },
  sold: { background: "rgba(0,163,85,0.15)", color: "#4ade80", border: "1px solid rgba(0,163,85,0.3)" },
  cancelled: { background: "rgba(198,40,40,0.1)", color: "#f87171", border: "1px solid rgba(198,40,40,0.3)" },
};

type ProductForm = {
  name: string;
  category: string;
  customCategory: string;
  price: number;
  quantity: number;
  description: string;
  status: "active" | "archived";
};

const emptyProductForm = (): ProductForm => ({
  name: "",
  category: "",
  customCategory: "",
  price: 0,
  quantity: 1,
  description: "",
  status: "active",
});

/** One number with its name and a line of context under it. */
function Figure({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
      <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.72rem", marginBottom: "0.3rem" }}>{label}</div>
      <div style={{ color: accent ?? "var(--theme-text, #e8f5e9)", fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.3 }}>{value}</div>
      {hint && <div style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.7rem", marginTop: "0.2rem" }}>{hint}</div>}
    </div>
  );
}

function ProductModal({
  uid,
  initial,
  onClose,
  onSaved,
  readOnly = false,
}: {
  uid: string;
  initial?: Product;
  onClose: () => void;
  onSaved: () => void;
  readOnly?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const [form, setForm] = useState<ProductForm>(
    initial
      ? {
          name: initial.name,
          category: PRODUCT_CATEGORIES.includes(initial.category as typeof PRODUCT_CATEGORIES[number])
            ? initial.category
            : "أخرى",
          customCategory: PRODUCT_CATEGORIES.includes(initial.category as typeof PRODUCT_CATEGORIES[number])
            ? ""
            : initial.category,
          price: initial.price,
          quantity: initial.quantity,
          description: initial.description,
          status: initial.status,
        }
      : emptyProductForm()
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const pf = (field: keyof ProductForm, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (readOnly) return;
    if (!form.name.trim()) { setErr("اسم المنتج مطلوب"); return; }
    const finalCategory = form.category === "أخرى" ? (form.customCategory.trim() || "أخرى") : form.category;
    setSaving(true);
    setErr("");
    try {
      let imageUrl = initial?.image;
      let contentImages = initial?.contentImages ?? [];

      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(`product-images/${uid}`, imageFile, setUploadProgress);
        setUploading(false);
      }

      if (extraFiles.length > 0) {
        setUploading(true);
        const urls = await Promise.all(
          extraFiles.map((f) => uploadImage(`product-images/${uid}`, f, setUploadProgress))
        );
        contentImages = [...contentImages, ...urls];
        setUploading(false);
      }

      const data = {
        storeId: uid,
        name: form.name.trim(),
        category: finalCategory,
        price: form.price,
        quantity: form.quantity,
        description: form.description.trim(),
        status: form.status,
        image: imageUrl,
        contentImages,
      };

      if (initial) {
        await updateProduct(initial.id, data);
      } else {
        await addProduct(data as Omit<Product, "id" | "createdAt">);
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr("حدث خطأ أثناء الحفظ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        dir="rtl"
        style={{
          background: "#141414",
          border: "1px solid var(--p-30)",
          borderRadius: "1rem",
          padding: "1.5rem",
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h3 style={{ color: "var(--theme-text, #e8f5e9)", fontWeight: 600, fontSize: "1.05rem" }}>
            {initial ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--theme-text-dim, #3a5e3a)", cursor: "pointer" }} type="button" aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={S.label} htmlFor="storemanager-1-62db52">اسم المنتج *</label>
            <input id="storemanager-1-62db52" style={S.input} value={form.name} onChange={(e) => pf("name", e.target.value)} placeholder="مثال: كاميرا Sony A7 IV" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={S.label} htmlFor="storemanager-2-d19792">الفئة</label>
              <select id="storemanager-2-d19792" style={S.input} value={form.category} onChange={(e) => pf("category", e.target.value)}>
                <option value="">اختر الفئة</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {form.category === "أخرى" && (
              <div>
                <label style={S.label} htmlFor="storemanager-3-9651c4">الفئة المخصصة</label>
                <input id="storemanager-3-9651c4" style={S.input} value={form.customCategory} onChange={(e) => pf("customCategory", e.target.value)} placeholder="اكتب الفئة..." />
              </div>
            )}
            <div>
              <label style={S.label} htmlFor="storemanager-4-840714">السعر (دج)</label>
              <input id="storemanager-4-840714" type="number" style={S.input} value={form.price} min={0} onChange={(e) => pf("price", +e.target.value)} />
            </div>
            <div>
              <label style={S.label} htmlFor="storemanager-5-6deefc">الكمية المتوفرة</label>
              <input id="storemanager-5-6deefc" type="number" style={S.input} value={form.quantity} min={0} onChange={(e) => pf("quantity", +e.target.value)} />
            </div>
          </div>

          <div>
            <label style={S.label} htmlFor="storemanager-6-935703">الوصف</label>
            <textarea id="storemanager-6-935703"
              style={{ ...S.input, minHeight: "80px", resize: "vertical" }}
              value={form.description}
              onChange={(e) => pf("description", e.target.value)}
            />
          </div>

          <div>
            <label style={S.label} htmlFor="storemanager-7-f179ee">الحالة</label>
            <select id="storemanager-7-f179ee" style={S.input} value={form.status} onChange={(e) => pf("status", e.target.value as "active" | "archived")}>
              <option value="active">نشط</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>

          <div>
            <label style={S.label} htmlFor="storemanager-8-cd1a2f">صورة المنتج</label>
            <input id="storemanager-8-cd1a2f"
              type="file"
              accept="image/*"
              style={{ ...S.input, padding: "0.4rem 0.85rem" }}
              onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }}
            />
            {initial?.image && !imageFile && (
              <img loading="lazy" decoding="async" src={initial.image} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: "0.4rem", marginTop: "0.4rem", border: "1px solid var(--p-20)" }} />
            )}
          </div>

          <div>
            <label style={S.label} htmlFor="storemanager-9-cbe00c">صور إضافية (يمكن اختيار أكثر من صورة)</label>
            <input id="storemanager-9-cbe00c"
              type="file"
              accept="image/*"
              multiple
              style={{ ...S.input, padding: "0.4rem 0.85rem" }}
              onChange={(e) => { if (e.target.files) setExtraFiles(Array.from(e.target.files)); }}
            />
          </div>

          {uploading && (
            <div style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.8rem" }}>
              جاري رفع الصور... {uploadProgress}%
            </div>
          )}

          {err && (
            <div style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)", borderRadius: "0.5rem", padding: "0.6rem 1rem", color: "#f87171", fontSize: "0.875rem" }}>
              {err}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <button onClick={onClose} style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary, #a5d6a7)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", background: "none", cursor: "pointer" }}>
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              style={{
                background: "var(--theme-accent, #00a355)",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.5rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: saving || uploading ? "not-allowed" : "pointer",
                opacity: saving || uploading ? 0.7 : 1,
              }}
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoreManager({
  uid,
  profile,
  readOnly = false,
}: { uid: string; profile: UserProfile; readOnly?: boolean }) {
  // A preview shows this screen from a stand-in account that does not exist.
  // Reading finds nothing; writing must not even be attempted.
  const [tab, setTab] = useState<"products" | "orders" | "delivery">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>(undefined);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "all">("all");
  const [sellerNotes, setSellerNotes] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const notesRef = useRef<Record<string, string>>({});

  // Where this shop delivers, and for how much. Kept on the profile, so a
  // buyer's page can read it without a second collection.
  const [zones, setZones] = useState<DeliveryZone[]>(profile.delivery ?? []);
  const [savingZones, setSavingZones] = useState(false);
  const [zonesSaved, setZonesSaved] = useState(false);
  useEffect(() => { setZones(profile.delivery ?? []); }, [profile.delivery]);

  const toggleZone = (wilaya: string) => {
    if (readOnly) return;
    setZonesSaved(false);
    setZones((current) =>
      current.some((z) => z.wilaya === wilaya)
        ? current.filter((z) => z.wilaya !== wilaya)
        : [...current, { wilaya, price: 0 }]
    );
  };

  const setZonePrice = (wilaya: string, price: number) => {
    if (readOnly) return;
    setZonesSaved(false);
    setZones((current) => current.map((z) => (z.wilaya === wilaya ? { ...z, price: Math.max(0, price) } : z)));
  };

  const saveZones = async () => {
    if (readOnly) return;
    setSavingZones(true);
    try {
      // Only this field travels; the rest of the profile is read back from
      // what is already loaded so nothing else is touched.
      await saveUserProfile(uid, { ...profile, delivery: zones });
      setZonesSaved(true);
      setTimeout(() => setZonesSaved(false), 3000);
    } finally {
      setSavingZones(false);
    }
  };

  useEffect(() => {
    const unsub1 = subscribeToStoreProducts(uid, setProducts);
    const unsub2 = subscribeToStoreOrders(uid, (ords) => {
      setOrders(ords);
      // Initialize seller notes
      const notes: Record<string, string> = {};
      ords.forEach((o) => { notes[o.id] = o.sellerNote ?? ""; });
      setSellerNotes((prev) => {
        const merged = { ...notes };
        Object.keys(prev).forEach((k) => { if (prev[k] !== notes[k]) merged[k] = prev[k]; });
        return merged;
      });
      notesRef.current = notes;
    });
    return () => { unsub1(); unsub2(); };
  }, [uid]);

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    if (!window.confirm("هل تريد حذف هذا المنتج نهائياً؟")) return;
    await deleteProduct(id);
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    if (readOnly) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setSavingStatus((s) => ({ ...s, [orderId]: true }));
    try {
      // Marking an order sold takes its units out of stock, and undoing that
      // puts them back — in one transaction, so the two cannot disagree.
      await setOrderStatus(order, status);
    } finally {
      setSavingStatus((s) => ({ ...s, [orderId]: false }));
    }
  };

  const handleSaveNote = async (orderId: string) => {
    if (readOnly) return;
    setSavingNote((s) => ({ ...s, [orderId]: true }));
    await updateOrder(orderId, { sellerNote: sellerNotes[orderId] ?? "" });
    setSavingNote((s) => ({ ...s, [orderId]: false }));
  };

  const filteredOrders = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);
  const stats = storeStats(orders, products);
  const top = bestSellers(orders);

  return (
    <div dir="rtl">
      {/* What the shop is actually doing. A list of orders and a column of
          stock numbers never added up to any of this. */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))" }}>
        <Figure label="مبيعات" value={formatDinars(stats.revenue)} hint={`${stats.sold} طلب مُباع`} accent="#4ade80" />
        <Figure label="قيد الانتظار" value={String(stats.pending)} hint={stats.inDelivery > 0 ? `${stats.inDelivery} في التوصيل` : "لا شيء ينتظر"} accent={stats.pending > 0 ? "#fbbf24" : undefined} />
        <Figure label="المخزون" value={String(stats.stock)} hint={`${products.length} منتج`} />
        <Figure
          label="نفد أو يوشك"
          value={String(stats.outOfStock + stats.lowStock)}
          hint={stats.outOfStock > 0 ? `${stats.outOfStock} نفد تماماً` : `الحد: ${LOW_STOCK} قطع`}
          accent={stats.outOfStock + stats.lowStock > 0 ? "#f87171" : undefined}
        />
      </div>

      {top.length > 0 && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
          <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.78rem", marginBottom: "0.6rem" }}>الأكثر مبيعاً</p>
          <div className="flex flex-wrap gap-2">
            {top.map((row) => (
              <span key={row.productId} style={{ fontSize: "0.8rem", color: "var(--theme-text, #e8f5e9)", background: "var(--p-12)", border: "1px solid var(--p-20)", borderRadius: "9999px", padding: "0.25rem 0.75rem" }}>
                {row.name} · {row.units}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--p-20)", paddingBottom: "0" }}>
        {(["products", "orders", "delivery"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.6rem 1.25rem",
              fontSize: "0.925rem",
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "var(--theme-accent, #00a355)" : "var(--theme-text-secondary, #a5d6a7)",
              borderBottom: tab === t ? "2px solid var(--theme-accent, #00a355)" : "2px solid transparent",
              marginBottom: "-1px",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {t === "products" ? <Package size={15} /> : t === "orders" ? <ShoppingBag size={15} /> : <Truck size={15} />}
            {t === "products" ? "المنتجات" : t === "orders" ? "الطلبيات" : "التوصيل"}
            <span style={{ fontSize: "0.75rem", background: "var(--p-20)", borderRadius: "9999px", padding: "0 0.4rem" }}>
              {t === "products" ? products.length : t === "orders" ? orders.length : zones.length}
            </span>
          </button>
        ))}
      </div>

      {/* Products tab */}
      {tab === "products" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button
              onClick={() => { setEditProduct(undefined); setShowModal(true); }}
              style={{
                background: "var(--theme-accent, #00a355)",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.5rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Plus size={15} />
              إضافة منتج
            </button>
          </div>

          <div style={{ ...S.card, overflow: "hidden", padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["الصورة", "الاسم", "الفئة", "السعر", "الكمية", "الحالة", "إجراءات"].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>
                        لا توجد منتجات بعد. اضغط "إضافة منتج" للبدء.
                      </td>
                    </tr>
                  ) : products.map((p) => (
                    <tr key={p.id} style={{ transition: "background 0.15s" }}>
                      <td style={S.td}>
                        {p.image ? (
                          <img loading="lazy" decoding="async" src={p.image} alt={p.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "0.35rem", border: "1px solid var(--p-20)" }} />
                        ) : (
                          <div style={{ width: 40, height: 40, background: "var(--p-20)", borderRadius: "0.35rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package size={18} style={{ color: "var(--theme-text-dim, #3a5e3a)" }} />
                          </div>
                        )}
                      </td>
                      <td style={{ ...S.td, maxWidth: 160 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      </td>
                      <td style={S.td}>{p.category}</td>
                      <td style={S.td}>{p.price.toLocaleString()} دج</td>
                      <td style={S.td}>
                        {p.quantity === 0 ? (
                          <span style={{ color: "#f87171", fontWeight: 600 }}>نفد</span>
                        ) : p.quantity <= LOW_STOCK ? (
                          <span style={{ color: "#fbbf24" }}>{p.quantity} — يوشك</span>
                        ) : (
                          p.quantity
                        )}
                      </td>
                      <td style={S.td}>
                        <span style={{
                          ...(p.status === "active"
                            ? { background: "rgba(0,163,85,0.15)", color: "#4ade80", border: "1px solid rgba(0,163,85,0.3)" }
                            : { background: "var(--p-10)", color: "var(--theme-text-dim, #3a5e3a)", border: "1px solid var(--p-20)" }),
                          fontSize: "0.72rem",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                        }}>
                          {p.status === "active" ? "نشط" : "مؤرشف"}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            onClick={() => { setEditProduct(p); setShowModal(true); }}
                            style={{ background: "var(--p-15)", border: "1px solid var(--p-30)", borderRadius: "0.4rem", padding: "0.3rem 0.6rem", cursor: "pointer", color: "var(--theme-text-secondary, #a5d6a7)" }}
                            title="تعديل"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)", borderRadius: "0.4rem", padding: "0.3rem 0.6rem", cursor: "pointer", color: "#f87171" }}
                            title="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Orders tab */}
      {tab === "orders" && (
        <div>
          {/* Filter */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {(["all", "pending", "in_delivery", "sold", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setOrderFilter(s)}
                style={{
                  background: orderFilter === s ? "rgba(0,163,85,0.2)" : "var(--p-10)",
                  border: orderFilter === s ? "1px solid rgba(0,163,85,0.4)" : "1px solid var(--p-20)",
                  color: orderFilter === s ? "var(--theme-accent, #00a355)" : "var(--theme-text-secondary, #a5d6a7)",
                  borderRadius: "9999px",
                  padding: "0.3rem 0.85rem",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                {s === "all" ? "الكل" : ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div style={{ ...S.card, overflow: "hidden", padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["المنتج", "المشتري", "الهاتف", "الولاية", "الكمية", "الحالة", "ملاحظة المشتري", "إجراءات"].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>
                        لا توجد طلبيات.
                      </td>
                    </tr>
                  ) : filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ ...S.td, maxWidth: 140 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.productName}</span>
                      </td>
                      <td style={S.td}>{o.buyerFirstName} {o.buyerLastName}</td>
                      <td style={S.td}>
                        {o.buyerPhone ? (
                          <a href={`tel:${o.buyerPhone}`} dir="ltr" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none", whiteSpace: "nowrap" }}>
                            {o.buyerPhone}
                          </a>
                        ) : (
                          // Orders placed before the phone field existed.
                          <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>—</span>
                        )}
                      </td>
                      <td style={S.td}>{o.wilaya}</td>
                      <td style={S.td}>{o.quantity}</td>
                      <td style={S.td}>
                        <span style={{ ...ORDER_STATUS_COLORS[o.status], fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                          {ORDER_STATUS_LABELS[o.status]}
                        </span>
                      </td>
                      <td style={{ ...S.td, maxWidth: 160 }}>
                        <span style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.8rem" }}>
                          {o.note || "—"}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 180 }}>
                          <select
                            style={{ ...S.input, padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                            value={o.status}
                            disabled={savingStatus[o.id]}
                            onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                          >
                            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                          <div style={{ display: "flex", gap: "0.3rem" }}>
                            <textarea
                              style={{ ...S.input, padding: "0.3rem 0.6rem", fontSize: "0.78rem", minHeight: 40, resize: "vertical", flex: 1 }}
                              placeholder="ملاحظة للمشتري..."
                              value={sellerNotes[o.id] ?? ""}
                              onChange={(e) => setSellerNotes((n) => ({ ...n, [o.id]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleSaveNote(o.id)}
                              disabled={savingNote[o.id]}
                              style={{
                                background: "rgba(0,163,85,0.2)",
                                border: "1px solid rgba(0,163,85,0.3)",
                                color: "var(--theme-accent, #00a355)",
                                borderRadius: "0.4rem",
                                padding: "0.3rem 0.5rem",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                alignSelf: "flex-start",
              }}
                            >
                              {savingNote[o.id] ? "..." : "حفظ"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Where this shop delivers. A buyer four wilayas away used to find out
          only when the seller phoned back — if the seller bothered. */}
      {tab === "delivery" && (
        <div>
          <p className="mb-4 text-sm" style={{ color: "var(--theme-text-muted, #4a7a4a)", lineHeight: 1.9 }}>
            اختر الولايات التي توصّل إليها وسعر التوصيل لكل واحدة. يظهر هذا للمشتري في صفحة متجرك،
            فيعرف قبل أن يطلب. اتركه بـ ٠ إن كان التوصيل مجانياً.
          </p>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button
              onClick={saveZones}
              disabled={readOnly || savingZones}
              className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              <span>{savingZones ? "جارٍ الحفظ..." : zonesSaved ? "✓ حُفظ" : "حفظ الولايات"}</span>
            </button>
            <span style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.8rem" }}>
              {zones.length === 0 ? "لم تختر أي ولاية بعد" : `${zones.length} ولاية`}
            </span>
          </div>

          {zones.length > 0 && (
            <div className="mb-5 rounded-xl p-4" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}>
                {zones.map((zone) => (
                  <div key={zone.wilaya} className="flex items-center gap-2">
                    <span style={{ color: "var(--theme-text, #e8f5e9)", fontSize: "0.85rem", flex: 1, minWidth: 0 }}>
                      {zone.wilaya}
                    </span>
                    <input
                      type="number"
                      min={0}
                      aria-label={`سعر التوصيل إلى ${zone.wilaya}`}
                      value={zone.price}
                      disabled={readOnly}
                      onChange={(e) => setZonePrice(zone.wilaya, Number(e.target.value))}
                      style={{ ...S.input, width: "6.5rem", padding: "0.35rem 0.5rem" }}
                    />
                    <span style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.75rem" }}>دج</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mb-2 text-xs" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>اضغط ولاية لإضافتها أو إزالتها</p>
          <div className="flex flex-wrap gap-2">
            {WILAYAS.map((wilaya) => {
              const chosen = zones.some((z) => z.wilaya === wilaya);
              return (
                <button
                  key={wilaya}
                  type="button"
                  aria-pressed={chosen}
                  disabled={readOnly}
                  onClick={() => toggleZone(wilaya)}
                  style={{
                    padding: "0.3rem 0.7rem",
                    borderRadius: "9999px",
                    fontSize: "0.78rem",
                    cursor: readOnly ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    color: chosen ? "#07130b" : "var(--theme-text-secondary, #a5d6a7)",
                    background: chosen ? "var(--theme-accent, #00a355)" : "var(--p-10)",
                    border: `1px solid ${chosen ? "var(--theme-accent, #00a355)" : "var(--p-25)"}`,
                  }}
                >
                  {chosen && <Check size={12} />}
                  {wilaya}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Product modal */}
      {showModal && (
        <ProductModal
          uid={uid}
          initial={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(undefined); }}
          onSaved={() => {}}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
