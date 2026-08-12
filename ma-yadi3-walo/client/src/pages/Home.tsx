/* Design philosophy: contemporary agrarian editorial — the visitor sees a warm, living market; the owner changes its story from the protected control room. */
import { useMemo, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowUpLeft,
  Bell,
  Bot,
  ChevronLeft,
  CircleHelp,
  Heart,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  PackageCheck,
  PhoneCall,
  Plus,
  Recycle,
  Search,
  Send,
  ShoppingBasket,
  Sparkles,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const HERO_IMAGE = "/manus-storage/walo-hero_e511b490.jpg";
const PRODUCE_IMAGE = "/manus-storage/walo-produce_04591401.jpg";
const MAP_IMAGE = "/manus-storage/walo-map_ab88a8d7.jpg";
const LOGO_IMAGE = "/manus-storage/walo-mark_787d00bf.png";

type PublicProduct = { id: number | string; name: string; category: string; farm: string; location: string; price: string; availability: string; imageUrl?: string | null };
type PublicService = { id: number | string; title: string; description: string; icon: string };

const defaultSettings = {
  announcementText: "كل كيلو يتم إنقاذه… حكاية خير جديدة",
  heroBadge: "محصول طازج، أثر أكبر",
  heroTitle: "الخير ما يضيع",
  heroAccent: "والو.",
  heroDescription: "منصة تجمع فائض المزارع بالبيت والحي والجهة المحتاجة، عشان كل ثمرة تلقى طريقها.",
  heroCta: "تصفح المنتجات",
  productsTitle: "اختار الخير القريب منك",
  servicesLabel: "خدماتنا",
  servicesTitle: "مش مجرد منتجات. منظومة خير.",
  impactTitle: "كل حركة صغيرة تزرع فرقًا.",
  assistantTitle: "فوكال، معك في كل اختيار",
  supportEmail: "maydi3walo@example.com",
  primaryColor: "#1C6B3C",
  accentColor: "#D9553F",
  heroImageUrl: HERO_IMAGE,
  mapImageUrl: MAP_IMAGE,
};

const steps = [
  { number: "01", title: "المزارع يعرض", text: "فائضًا طازجًا من حقله قبل أن يفقد قيمته.", icon: Leaf },
  { number: "02", title: "أنت تختار", text: "الكمية والموقع وطريقة الاستلام التي تناسبك.", icon: ShoppingBasket },
  { number: "03", title: "الخير يدور", text: "نصل المحصول إلى البيت أو الجهة الأقرب له.", icon: Recycle },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return <a href="#top" className={`brand-lockup ${compact ? "brand-lockup--compact" : ""}`} aria-label="ما يضيع والو - الرئيسية"><span className="brand-mark-wrap"><img src={LOGO_IMAGE} alt="" className="brand-mark" /></span>{!compact && <span className="brand-copy"><strong>ما يضيع والو</strong><small>من الحقل… للخير</small></span>}</a>;
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return <div className="section-heading"><div><span className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</span><h2>{title}</h2></div><div className="section-heading__aside">{body && <p>{body}</p>}<a href="#products" className="text-link">شاهد المنتجات <ArrowLeft size={16} /></a></div></div>;
}

function ProductCard({ product, onAdd }: { product: PublicProduct; onAdd: (name: string) => void }) {
  const [liked, setLiked] = useState(false);
  return <article className="product-card"><div className="product-card__image-wrap"><img src={product.imageUrl || PRODUCE_IMAGE} alt={product.name} className="product-card__image" /><span className="product-tag">{product.availability}</span><button className={`icon-button image-heart ${liked ? "is-liked" : ""}`} onClick={() => setLiked(!liked)} aria-label={liked ? `إزالة ${product.name} من المفضلة` : `إضافة ${product.name} للمفضلة`}><Heart size={17} fill={liked ? "currentColor" : "none"} /></button></div><div className="product-card__body"><div className="product-card__meta"><span>{product.category}</span><span className="meta-separator">·</span><span>{product.location}</span></div><h3>{product.name}</h3><p className="product-card__farm"><MapPin size={14} /> {product.farm}</p><div className="product-card__footer"><strong>{product.price}</strong><button className="add-product" onClick={() => onAdd(product.name)} aria-label={`إضافة ${product.name} للسلة`}><Plus size={17} /></button></div></div></article>;
}

function ServiceIcon({ icon }: { icon: string }) { if (icon === "PackageCheck") return <PackageCheck size={18} />; if (icon === "Recycle") return <Recycle size={18} />; if (icon === "Leaf") return <Leaf size={18} />; return <Truck size={18} />; }

export default function Home() {
  const [, setLocation] = useLocation();
  const catalog = trpc.catalog.get.useQuery(undefined, { retry: 1, staleTime: 20_000 });
  const settings = { ...defaultSettings, ...(catalog.data?.settings ?? {}) };
  const products: PublicProduct[] = catalog.data?.products ?? [];
  const services: PublicService[] = catalog.data?.services ?? [];
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [assistantText, setAssistantText] = useState("");
  const [assistantReply, setAssistantReply] = useState("مرحبًا! أنا فوكال. اسألني عن المحاصيل القريبة أو أفضل طريقة لاستلام طلبك.");
  const categories = useMemo(() => ["الكل", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const filteredProducts = useMemo(() => products.filter((product) => (activeCategory === "الكل" || product.category === activeCategory) && `${product.name} ${product.farm} ${product.location}`.includes(searchTerm.trim())), [activeCategory, products, searchTerm]);
  const colors = { "--primary": settings.primaryColor, "--tomato": settings.accentColor } as CSSProperties;

  const addToCart = (name: string) => { setCartCount((count) => count + 1); toast.success(`تمت إضافة ${name}`, { description: "يمكنك مراجعة طلبك من شريط السلة." }); };
  const sendAssistant = (preset?: string) => { const message = (preset ?? assistantText).trim(); if (!message) { toast.info("اكتب سؤالك أولًا", { description: "فوكال جاهز لمساعدتك." }); return; } setAssistantReply(message.includes("بطاطا") ? "فلتر المنتجات حسب منطقتك لتجد عروض البطاطا الأقرب لك، أو تواصل مع خدمة النقل لترتيب الاستلام." : "وجدت لك طريقًا بسيطًا: تصفح العروض القريبة، اختر الكمية، ثم حدّد طريقة الاستلام التي تناسبك."); setAssistantText(""); };

  return <div className="site-shell" id="top" style={colors}><div className="announcement-bar"><Sparkles size={14} /><span>{settings.announcementText}</span><a href="#how-it-works">اكتشف كيف تعمل المنصة <ArrowLeft size={13} /></a></div><header className="site-header"><div className="container header-inner"><Logo /><nav className={`main-nav ${mobileMenu ? "is-open" : ""}`} aria-label="التنقل الرئيسي"><a href="#products" onClick={() => setMobileMenu(false)}>المنتجات</a><a href="#services" onClick={() => setMobileMenu(false)}>الخدمات</a><a href="#how-it-works" onClick={() => setMobileMenu(false)}>كيف تعمل</a><a href="#impact" onClick={() => setMobileMenu(false)}>أثرنا</a></nav><div className="header-actions"><button className="header-icon" aria-label="الإشعارات" onClick={() => toast.info("لا توجد إشعارات جديدة")}><Bell size={18} /></button><button className="header-account" onClick={() => setLocation("/admin")}><UserRound size={17} /><span>الإدارة</span></button><button className="mobile-menu-button" aria-label={mobileMenu ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={22} /> : <Menu size={22} />}</button></div></div></header><main><section className="hero-section"><div className="container hero-grid"><div className="hero-copy"><span className="hero-kicker"><span className="live-pulse" />{settings.heroBadge}</span><h1>{settings.heroTitle} <em>{settings.heroAccent}</em></h1><p className="hero-lead">{settings.heroDescription}</p><div className="hero-ctas"><a className="button button--primary" href="#products">{settings.heroCta} <ArrowLeft size={17} /></a><a className="button button--quiet" href="#how-it-works">كيف نساعد؟ <ArrowUpLeft size={16} /></a></div><div className="hero-note"><span className="hero-note__avatars"><span>ن</span><span>م</span><span>س</span></span><span>مساحة قابلة للتعديل من لوحة الإدارة</span></div></div><div className="hero-visual"><div className="hero-image-card"><img src={settings.heroImageUrl || HERO_IMAGE} alt="صندوق خضروات طازجة في حقل أخضر" /><div className="hero-image-overlay" /></div><div className="hero-stamp"><Recycle size={18} /><span>نُنقذ</span><strong>المحصول</strong></div><div className="hero-stat-card"><div className="stat-icon"><Leaf size={17} /></div><div><strong>متجدد</strong><span>محتوى يُدار من الموقع</span></div></div><div className="hero-scribble" aria-hidden="true">✳</div></div></div><div className="hero-bottom-band"><div className="container hero-bottom-inner"><span>من الحقل</span><span className="dotted-line" /><span>إلى بيتك</span><span className="dotted-line" /><span>بدون هدر</span><ChevronLeft size={18} /></div></div></section><section className="section section--search" id="products"><div className="container"><div className="search-panel"><div><span className="eyebrow"><span className="eyebrow-dot" />سوق اليوم</span><h2>{settings.productsTitle}</h2></div><div className="search-box"><Search size={18} /><input aria-label="ابحث عن منتج أو مدينة" placeholder="ابحث عن طماطم، بطاطا، أو مدينة…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /><button aria-label="البحث الصوتي" onClick={() => toast.info("البحث الصوتي قريبًا")}><Mic size={17} /></button></div></div><div className="category-row" role="tablist" aria-label="تصنيفات المنتجات">{categories.map((category) => <button key={category} className={`category-pill ${activeCategory === category ? "is-active" : ""}`} onClick={() => setActiveCategory(category)}>{category}{category === "الكل" && <span>{products.length}</span>}</button>)}</div><div className="products-layout"><div className="products-grid">{catalog.isLoading ? <div className="empty-state"><CircleHelp size={28} /><h3>جاري تحميل سوق اليوم…</h3><p>نجهّز أحدث العروض لك.</p></div> : filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}{!catalog.isLoading && filteredProducts.length === 0 && <div className="empty-state"><CircleHelp size={28} /><h3>لا توجد منتجات ظاهرة الآن</h3><p>أضف أول عرض من لوحة الإدارة ليظهر هنا للزوار.</p></div>}</div><aside className="supply-card"><div className="supply-card__leaf"><Leaf size={20} /></div><span className="eyebrow">من المزارع مباشرة</span><h3>الطازج له عنوان</h3><p>كل عرض حقيقي تضيفه من لوحة الإدارة يحمل مصدره ومنطقته وطريقة ظهوره.</p><button onClick={() => setLocation("/admin/products")} className="text-link">إدارة العروض <ArrowLeft size={15} /></button><div className="supply-card__line" /></aside></div></div></section><section className="section section--paper" id="how-it-works"><div className="container"><SectionHeading eyebrow="كيف تدور الحكاية؟" title="من فائض بسيط… إلى فرق واضح" body="ثلاث خطوات خفيفة تخلي المحصول يكمّل رحلته بدل ما ينتهي في مكانه." /><div className="steps-grid">{steps.map(({ number, title, text, icon: Icon }, index) => <div className="step-card" key={number}><div className="step-card__top"><span className="step-number">{number}</span><span className="step-icon"><Icon size={20} /></span></div><h3>{title}</h3><p>{text}</p>{index < steps.length - 1 && <span className="step-connector" aria-hidden="true"><ArrowLeft size={15} /></span>}</div>)}</div></div></section><section className="section section--services" id="services"><div className="container services-grid"><div className="map-card"><img src={settings.mapImageUrl || MAP_IMAGE} alt="خريطة توضيحية لمسار المحصول بين المزرعة والحي" /><div className="map-card__overlay"><div className="map-route-label"><Truck size={16} /><span>في الطريق إليك</span><strong>مسار مرن</strong></div></div><div className="map-pin map-pin--one"><MapPin size={17} /></div><div className="map-pin map-pin--two"><MapPin size={17} /></div><div className="map-pin map-pin--three"><MapPin size={17} /></div></div><div className="service-copy"><span className="eyebrow"><span className="eyebrow-dot" />{settings.servicesLabel}</span><h2>{settings.servicesTitle}</h2><p>سواء كنت مزارعًا عندك فائض، أو بيتًا يبحث عن الطازج، أو جهة تحتاج توصيلًا موثوقًا؛ عندنا طريق أوضح لكل خطوة.</p><div className="service-list">{services.length ? services.map((service) => <div className="service-item" key={service.id}><span><ServiceIcon icon={service.icon} /></span><div><strong>{service.title}</strong><small>{service.description}</small></div><ChevronLeft size={16} /></div>) : <p className="text-sm text-[#718075]">ستظهر الخدمات التي تضيفها من لوحة الإدارة هنا.</p>}</div></div></div></section><section className="impact-section" id="impact"><div className="container impact-grid"><div className="impact-copy"><span className="eyebrow eyebrow--light"><span className="eyebrow-dot" />أثرنا بالأرقام</span><h2>{settings.impactTitle}</h2><p>هذه المساحة تعرّف الزوار برسالة المنصة. يمكنك تعديل عنوانها وصور الواجهة من قسم المظهر في لوحة الإدارة.</p><a className="button button--light" href="#assistant">اسأل فوكال <Bot size={17} /></a></div><div className="impact-numbers"><div className="impact-number"><strong>—</strong><span>كغ محصول محفوظ</span></div><div className="impact-number"><strong>{products.length}</strong><span>عرض متاح</span></div><div className="impact-number"><strong>{services.length}</strong><span>خدمات منظمة</span></div><div className="impact-number"><strong>100%</strong><span>تحكم بالمحتوى</span></div></div></div></section><section className="section assistant-section" id="assistant"><div className="container assistant-card"><div className="assistant-orb"><Bot size={40} /><span className="assistant-wave assistant-wave--one" /><span className="assistant-wave assistant-wave--two" /></div><div className="assistant-content"><span className="eyebrow"><span className="eyebrow-dot" />المساعد الذكي</span><h2>{settings.assistantTitle}</h2><p className="assistant-reply">{assistantReply}</p><div className="assistant-suggestions"><button onClick={() => sendAssistant("أين أجد بطاطا قريبة؟")}>أين أجد بطاطا قريبة؟</button><button onClick={() => sendAssistant("كيف أستلم طلبي؟")}>كيف أستلم طلبي؟</button><button onClick={() => sendAssistant("أريد عرض فائض")}>أريد عرض فائض</button></div><div className="assistant-input"><input aria-label="اكتب سؤالك لفوكال" placeholder="اكتب سؤالك لفوكال…" value={assistantText} onChange={(event) => setAssistantText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendAssistant()} /><button aria-label="إرسال السؤال" onClick={() => sendAssistant()}><Send size={17} /></button></div></div></div></section></main><footer className="site-footer"><div className="container footer-grid"><div className="footer-brand"><Logo compact /><p>نخلي الخير يدور، من الحقل إلى المكان الذي يحتاجه.</p><div className="footer-socials"><button aria-label="واتساب" onClick={() => toast.info("التواصل عبر واتساب قريبًا")}><PhoneCall size={17} /></button><button aria-label="الرسائل" onClick={() => toast.info("الرسائل قريبًا")}><MessageCircle size={17} /></button></div></div><div className="footer-links"><div><strong>استكشف</strong><a href="#products">المنتجات</a><a href="#services">الخدمات</a><a href="#impact">أثرنا</a></div><div><strong>شارك الخير</strong><a href="#how-it-works">كيف تعمل</a><a href="#assistant">اسأل فوكال</a><button onClick={() => setLocation("/admin")}>لوحة الإدارة</button></div></div><div className="footer-contact"><span className="eyebrow">خلّينا على تواصل</span><a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a><span>الجزائر · نكبر مع كل حي</span></div></div><div className="container footer-bottom"><span>© 2026 ما يضيع والو</span><span>المحتوى والألوان قابلان للإدارة من داخل الموقع</span><span className="footer-cart"><ShoppingBasket size={15} /> {cartCount > 0 ? `${cartCount} في السلة` : "السلة فارغة"}</span></div></footer><nav className="mobile-bottom-nav" aria-label="التنقل السريع"><a href="#top"><Leaf size={18} /><span>الرئيسية</span></a><a href="#products"><Search size={18} /><span>المنتجات</span></a><button className="mobile-add" onClick={() => setLocation("/admin/products")}><Plus size={23} /></button><a href="#services"><MapPin size={18} /><span>الخدمات</span></a><a href="#assistant"><Bot size={18} /><span>فوكال</span></a></nav></div>;
}
