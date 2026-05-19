import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Tag, DollarSign, User, Phone, ArrowRight } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Equipment } from "../../lib/types";

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "equipment", id)).then((snap) => {
      if (!snap.exists()) {
        setNotFound(true);
      } else {
        setEquipment({ id: snap.id, ...snap.data() } as Equipment);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "#0e0e0e" }}>
        <div style={{ color: "#3a5e3a" }}>جاري التحميل...</div>
      </div>
    );
  }

  if (notFound || !equipment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl" style={{ background: "#0e0e0e" }}>
        <ShoppingCart size={48} style={{ color: "#2a4a2a" }} />
        <p style={{ color: "#4a7a4a" }}>المنتج غير موجود</p>
        <Link to="/equipment" style={{ color: "#00a355", textDecoration: "none", fontSize: "0.875rem" }}>← العودة لمتجر العتاد</Link>
      </div>
    );
  }

  const eq = equipment;

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Back link */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          to="/equipment"
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-green-400"
          style={{ color: "#4a7a4a", textDecoration: "none" }}
        >
          <ArrowRight size={15} />
          العودة إلى متجر العتاد
        </Link>
      </div>

      {/* Cover image */}
      {eq.image ? (
        <div className="w-full mt-4 overflow-hidden" style={{ maxHeight: "420px" }}>
          <img
            src={eq.image}
            alt={eq.name}
            className="w-full object-cover"
            style={{ maxHeight: "420px", objectPosition: "center" }}
          />
        </div>
      ) : (
        <div
          className="w-full mt-4 flex items-center justify-center"
          style={{ height: "200px", background: "linear-gradient(135deg, rgba(0,98,51,0.15), rgba(0,98,51,0.05))", borderBottom: "1px solid rgba(0,98,51,0.2)" }}
        >
          <ShoppingCart size={64} style={{ color: "rgba(0,98,51,0.3)" }} />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Badges */}
        <div className="flex items-center gap-3 mb-4">
          {eq.category && (
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: "rgba(0,98,51,0.3)", color: "#81c784" }}
            >
              {eq.category}
            </span>
          )}
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: eq.condition === "new" ? "rgba(0,98,51,0.25)" : "rgba(120,66,18,0.3)",
              color: eq.condition === "new" ? "#81c784" : "#f0b27a",
            }}
          >
            {eq.condition === "new" ? "جديد" : "مستعمل"}
          </span>
        </div>

        {/* Name */}
        <h1 className="text-3xl font-bold mb-3 leading-snug" style={{ color: "#e8f5e9" }}>{eq.name}</h1>

        {/* Description */}
        {eq.description && (
          <p className="text-base mb-6 leading-relaxed" style={{ color: "#a5d6a7" }}>{eq.description}</p>
        )}

        {/* Meta row */}
        <div
          className="flex flex-wrap gap-4 p-4 rounded-xl mb-8"
          style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid rgba(0,98,51,0.2)" }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: "#6aad6a" }}>
            <DollarSign size={15} style={{ color: "#00a355" }} />
            <span style={{ color: "#4a7a4a" }}>السعر:</span>
            <span style={{ color: "#e8f5e9", fontWeight: 600, fontSize: "1rem" }}>{eq.price.toLocaleString()} دج</span>
          </div>
          {eq.seller && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6aad6a" }}>
              <User size={15} style={{ color: "#00a355" }} />
              <span style={{ color: "#4a7a4a" }}>البائع:</span> {eq.seller}
            </div>
          )}
          {eq.category && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6aad6a" }}>
              <Tag size={15} style={{ color: "#00a355" }} />
              <span style={{ color: "#4a7a4a" }}>الفئة:</span> {eq.category}
            </div>
          )}
          {eq.contact && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6aad6a" }}>
              <Phone size={15} style={{ color: "#00a355" }} />
              <span style={{ color: "#4a7a4a" }}>التواصل:</span> {eq.contact}
            </div>
          )}
        </div>

        {/* Content images gallery */}
        {eq.contentImages && eq.contentImages.length > 0 && (
          <div className="mb-8">
            <div
              className="h-px mb-6"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,98,51,0.4), transparent)" }}
            />
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
            >
              {eq.contentImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`صورة ${idx + 1}`}
                  style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid rgba(0,98,51,0.2)" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Contact CTA */}
        {eq.contact && (
          <div
            className="p-5 rounded-xl"
            style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid rgba(0,98,51,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} style={{ color: "#00a355" }} />
              <h3 className="font-semibold" style={{ color: "#c8e6c9" }}>للتواصل مع البائع</h3>
            </div>
            <p style={{ color: "#6aad6a", fontSize: "0.9rem" }}>{eq.contact}</p>
          </div>
        )}
      </div>
    </div>
  );
}
