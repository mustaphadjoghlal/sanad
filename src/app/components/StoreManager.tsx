import { useState, useEffect, useRef } from "react";
import { Plus, X, Pencil, Trash2, Package, ShoppingBag } from "lucide-react";
import {
  subscribeToStoreProducts,
  subscribeToStoreOrders,
  addProduct,
  updateProduct,
  deleteProduct,
  updateOrder,
} from "../../lib/firestore";
import { uploadImage } from "../../lib/storage";
import type { UserProfile, Product, Order, OrderStatus } from "../../lib/types";
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

function ProductModal({
  uid,
  initial,
  onClose,
  onSaved,
}: {
  uid: string;
  initial?: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
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
    >
      <div
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
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--theme-text-dim, #3a5e3a)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={S.label}>اسم المنتج *</label>
            <input style={S.input} value={form.name} onChange={(e) => pf("name", e.target.value)} placeholder="مثال: كاميرا Sony A7 IV" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={S.label}>الفئة</label>
              <select style={S.input} value={form.category} onChange={(e) => pf("category", e.target.value)}>
                <option value="">اختر الفئة</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {form.category === "أخرى" && (
              <div>
                <label style={S.label}>الفئة المخصصة</label>
                <input style={S.input} value={form.customCategory} onChange={(e) => pf("customCategory", e.target.value)} placeholder="اكتب الفئة..." />
              </div>
            )}
            <div>
              <label style={S.label}>السعر (دج)</label>
              <input type="number" style={S.input} value={form.price} min={0} onChange={(e) => pf("price", +e.target.value)} />
            </div>
            <div>
              <label style={S.label}>الكمية المتوفرة</label>
              <input type="number" style={S.input} value={form.quantity} min={0} onChange={(e) => pf("quantity", +e.target.value)} />
            </div>
          </div>

          <div>
            <label style={S.label}>الوصف</label>
            <textarea
              style={{ ...S.input, minHeight: "80px", resize: "vertical" }}
              value={form.description}
              onChange={(e) => pf("description", e.target.value)}
            />
          </div>

          <div>
            <label style={S.label}>الحالة</label>
            <select style={S.input} value={form.status} onChange={(e) => pf("status", e.target.value as "active" | "archived")}>
              <option value="active">نشط</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>

          <div>
            <label style={S.label}>صورة المنتج</label>
            <input
              type="file"
              accept="image/*"
              style={{ ...S.input, padding: "0.4rem 0.85rem" }}
              onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }}
            />
            {initial?.image && !imageFile && (
              <img src={initial.image} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: "0.4rem", marginTop: "0.4rem", border: "1px solid var(--p-20)" }} />
            )}
          </div>

          <div>
            <label style={S.label}>صور إضافية (يمكن اختيار أكثر من صورة)</label>
            <input
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

export default function StoreManager({ uid }: { uid: string; profile: UserProfile }) {
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>(undefined);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "all">("all");
  const [sellerNotes, setSellerNotes] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const notesRef = useRef<Record<string, string>>({});

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
    if (!window.confirm("هل تريد حذف هذا المنتج نهائياً؟")) return;
    await deleteProduct(id);
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setSavingStatus((s) => ({ ...s, [orderId]: true }));
    await updateOrder(orderId, { status });
    setSavingStatus((s) => ({ ...s, [orderId]: false }));
  };

  const handleSaveNote = async (orderId: string) => {
    setSavingNote((s) => ({ ...s, [orderId]: true }));
    await updateOrder(orderId, { sellerNote: sellerNotes[orderId] ?? "" });
    setSavingNote((s) => ({ ...s, [orderId]: false }));
  };

  const filteredOrders = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);

  return (
    <div dir="rtl">
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--p-20)", paddingBottom: "0" }}>
        {(["products", "orders"] as const).map((t) => (
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
            {t === "products" ? <Package size={15} /> : <ShoppingBag size={15} />}
            {t === "products" ? "المنتجات" : "الطلبيات"}
            <span style={{ fontSize: "0.75rem", background: "var(--p-20)", borderRadius: "9999px", padding: "0 0.4rem" }}>
              {t === "products" ? products.length : orders.length}
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
                          <img src={p.image} alt={p.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "0.35rem", border: "1px solid var(--p-20)" }} />
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
                      <td style={S.td}>{p.quantity}</td>
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
                    {["المنتج", "المشتري", "الولاية", "الكمية", "الحالة", "ملاحظة المشتري", "إجراءات"].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>
                        لا توجد طلبيات.
                      </td>
                    </tr>
                  ) : filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ ...S.td, maxWidth: 140 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.productName}</span>
                      </td>
                      <td style={S.td}>{o.buyerFirstName} {o.buyerLastName}</td>
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

      {/* Product modal */}
      {showModal && (
        <ProductModal
          uid={uid}
          initial={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(undefined); }}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
