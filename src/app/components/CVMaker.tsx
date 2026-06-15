import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, X, FileText } from "lucide-react";
import type { UserProfile } from "../../lib/types";

const typeLabel: Record<string, string> = {
  editor_news: "محرر أخبار", web_digital: "ويب ديجيتال",
  presenter_programs: "مقدم برامج", presenter_news: "مقدم أخبار",
  monteur: "مونتير", graphic_designer: "جرافيك ديزاينر",
  cameraman: "كاميرا مان", producer: "منتج", director: "مخرج",
  program_writer: "معد برامج", voice: "معلق صوتي",
  host_stage: "منشط على الركح", student: "طالب إعلام",
  journalist: "صحفي", photographer: "مصور", editor: "مخرج / مونتير", other: "إعلامي",
};

interface Props { profile: UserProfile; uid: string; }

export default function CVMaker({ profile, uid }: Props) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cvRef = useRef<HTMLDivElement>(null);

  const profileUrl = `https://sanadz.media/profile/${uid}`;

  const handleDownload = async () => {
    if (!cvRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF }   = await import("jspdf");

      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf     = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w       = pdf.internal.pageSize.getWidth();
      const h       = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, w, h);
      pdf.save(`CV_${profile.name.replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const label = typeLabel[profile.type] ?? profile.type;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{ background: "linear-gradient(135deg,#1a3a2a,#0d2018)", border: "1px solid var(--p-30)", color: "var(--theme-accent)", cursor: "pointer" }}
      >
        <FileText size={16} />
        إنشاء CV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-2xl my-4">
            {/* Actions bar */}
            <div className="flex items-center justify-between mb-4 px-1">
              <button onClick={() => setOpen(false)} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "none", cursor: "pointer" }}>
                <X size={15} /> إغلاق
              </button>
              <button onClick={handleDownload} disabled={generating} className="btn-dz flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                <Download size={15} />
                {generating ? "جاري الإنشاء..." : "تحميل PDF"}
              </button>
            </div>

            {/* CV preview */}
            <div ref={cvRef} style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", direction: "rtl" }}>

              {/* Header green banner */}
              <div style={{ background: "linear-gradient(135deg,#006233,#00a355)", padding: "28px 32px", display: "flex", alignItems: "center", gap: "24px" }}>
                {/* Photo */}
                <div style={{ width: "90px", height: "90px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, border: "3px solid rgba(255,255,255,0.3)", background: "#004d28" }}>
                  {profile.photo
                    ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "32px" }}>👤</div>
                  }
                </div>

                {/* Name + title */}
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{profile.name}</h1>
                  <p style={{ margin: "6px 0 0", fontSize: "15px", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{label}</p>
                  {profile.specialty && <p style={{ margin: "3px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>{profile.specialty}</p>}
                </div>

                {/* QR code */}
                <div style={{ background: "#fff", padding: "8px", borderRadius: "10px", flexShrink: 0 }}>
                  <QRCodeSVG value={profileUrl} size={72} fgColor="#006233" bgColor="#ffffff" />
                  <p style={{ margin: "4px 0 0", fontSize: "8px", color: "#006233", textAlign: "center", fontWeight: 600 }}>أعمالي</p>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

                {/* Left column */}
                <div>
                  {/* Contact */}
                  <Section title="التواصل">
                    {profile.email && <InfoRow icon="✉" text={profile.email} />}
                    {profile.phone && <InfoRow icon="📞" text={profile.phone} />}
                    {profile.location && <InfoRow icon="📍" text={profile.location} />}
                    {(profile as any).whatsapp && <InfoRow icon="💬" text={(profile as any).whatsapp} />}
                    <InfoRow icon="🌐" text="sanadz.media" />
                  </Section>

                  {/* Skills / specialty */}
                  {profile.specialty && (
                    <Section title="التخصص">
                      <Tag text={profile.specialty} />
                      <Tag text={label} />
                    </Section>
                  )}

                  {/* Experience */}
                  {profile.experience && (
                    <Section title="الخبرة">
                      <p style={{ margin: 0, fontSize: "13px", color: "#333", lineHeight: 1.6 }}>{profile.experience}</p>
                    </Section>
                  )}

                  {/* Portfolio links */}
                  {profile.portfolio && profile.portfolio.length > 0 && (
                    <Section title="روابط الأعمال">
                      {profile.portfolio.map((l, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ color: "#00a355", fontSize: "10px" }}>🔗</span>
                          <span style={{ fontSize: "12px", color: "#006233", wordBreak: "break-all" }}>{l.label}</span>
                        </div>
                      ))}
                    </Section>
                  )}

                  {/* Videos */}
                  {profile.portfolioVideos && profile.portfolioVideos.length > 0 && (
                    <Section title="أعمال مرئية (يوتيوب)">
                      {profile.portfolioVideos.map((v, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "10px" }}>▶</span>
                          <span style={{ fontSize: "12px", color: "#006233" }}>{v.title || v.url}</span>
                        </div>
                      ))}
                    </Section>
                  )}
                </div>

                {/* Right column */}
                <div>
                  {/* Bio */}
                  {profile.bio && (
                    <Section title="نبذة تعريفية">
                      <p style={{ margin: 0, fontSize: "13px", color: "#444", lineHeight: 1.8, textAlign: "justify" }}>{profile.bio}</p>
                    </Section>
                  )}

                  {/* Achievements */}
                  {profile.achievements && (
                    <Section title="الإنجازات والمشاركات">
                      <p style={{ margin: 0, fontSize: "13px", color: "#444", lineHeight: 1.8 }}>{profile.achievements}</p>
                    </Section>
                  )}

                  {/* QR reminder */}
                  <div style={{ marginTop: "16px", padding: "14px", background: "#f0faf4", borderRadius: "10px", border: "1px solid #c8e6c9", textAlign: "center" }}>
                    <QRCodeSVG value={profileUrl} size={80} fgColor="#006233" bgColor="#f0faf4" />
                    <p style={{ margin: "8px 0 2px", fontSize: "11px", color: "#006233", fontWeight: 700 }}>امسح للاطلاع على أعمالي</p>
                    <p style={{ margin: 0, fontSize: "9px", color: "#4a9a5a", wordBreak: "break-all" }}>{profileUrl}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ background: "#f8f8f8", borderTop: "2px solid #00a355", padding: "10px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "#888" }}>تم إنشاء هذا السيرة الذاتية بواسطة منصة سند</span>
                <span style={{ fontSize: "12px", color: "#006233", fontWeight: 700 }}>sanadz.media</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <div style={{ width: "3px", height: "16px", background: "#00a355", borderRadius: "2px", flexShrink: 0 }} />
        <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#006233", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
      </div>
      <div style={{ paddingRight: "11px" }}>{children}</div>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
      <span style={{ fontSize: "12px", width: "16px", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: "12px", color: "#333", wordBreak: "break-all" }}>{text}</span>
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span style={{ display: "inline-block", background: "#e8f5e9", color: "#006233", fontSize: "11px", padding: "3px 10px", borderRadius: "20px", marginLeft: "6px", marginBottom: "5px", fontWeight: 600 }}>
      {text}
    </span>
  );
}
