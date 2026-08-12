/* Design philosophy: an Arabic-first garden control room — the calm, rounded market identity is retained while operations stay clear, focused, and safely gated. */
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowUpLeft,
  Eye,
  FileImage,
  ImagePlus,
  Leaf,
  Loader2,
  PackageCheck,
  Palette,
  Pencil,
  Plus,
  Recycle,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";

type SettingsDraft = {
  announcementText: string;
  heroBadge: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  heroCta: string;
  productsTitle: string;
  servicesLabel: string;
  servicesTitle: string;
  impactTitle: string;
  assistantTitle: string;
  supportEmail: string;
  primaryColor: string;
  accentColor: string;
  heroImageUrl?: string | null;
  heroImageKey?: string | null;
  mapImageUrl?: string | null;
  mapImageKey?: string | null;
};

type ProductDraft = {
  name: string;
  category: string;
  farm: string;
  location: string;
  price: string;
  availability: string;
  imageUrl?: string | null;
  imageKey?: string | null;
  status: "active" | "hidden";
};

type ServiceDraft = {
  title: string;
  description: string;
  icon: "Truck" | "PackageCheck" | "Recycle" | "Leaf";
  sortOrder: number;
  status: "active" | "hidden";
};

const emptyProduct: ProductDraft = { name: "", category: "خضروات", farm: "", location: "", price: "", availability: "متوفر اليوم", imageUrl: "", imageKey: "", status: "active" };
const emptyService: ServiceDraft = { title: "", description: "", icon: "Truck", sortOrder: 1, status: "active" };

const fallbackSettings: SettingsDraft = {
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
  heroImageUrl: "/manus-storage/walo-hero_e511b490.jpg",
  heroImageKey: "",
  mapImageUrl: "/manus-storage/walo-map_ab88a8d7.jpg",
  mapImageKey: "",
};

function sectionFromPath(path: string) {
  if (path.endsWith("/products")) return "products";
  if (path.endsWith("/services")) return "services";
  if (path.endsWith("/appearance")) return "appearance";
  return "overview";
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذر قراءة الصورة."));
    reader.readAsDataURL(file);
  });
}

function AdminModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#10281a]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="max-h-[91vh] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-[#dbe7d5] bg-[#fffdf7] shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e6ede2] bg-[#fffdf7]/96 px-5 py-4 backdrop-blur"><h2 className="font-['Noto_Kufi_Arabic'] text-base font-bold text-[#123c25]">{title}</h2><button className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf4e8] text-[#1c6b3c]" onClick={onClose} aria-label="إغلاق"><X size={18} /></button></div><div className="p-5">{children}</div></div></div>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`block ${wide ? "md:col-span-2" : ""}`}><span className="mb-2 block text-xs font-semibold text-[#526857]">{label}</span>{children}</label>;
}

function ImagePicker({ label, value, onUpload, uploading }: { label: string; value?: string | null; onUpload: (file: File) => void; uploading: boolean }) {
  return <div className="rounded-2xl border border-dashed border-[#cdddc6] bg-[#f7faf3] p-3"><span className="mb-2 block text-xs font-semibold text-[#526857]">{label}</span><div className="flex flex-wrap items-center gap-3">{value ? <img src={value} alt="معاينة" className="h-16 w-24 rounded-xl object-cover" /> : <span className="grid h-16 w-24 place-items-center rounded-xl bg-[#e7f0e1] text-[#6d8972]"><FileImage size={22} /></span>}<label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1c6b3c] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#155a31]"><ImagePlus size={15} />{uploading ? "جاري الرفع…" : "اختيار صورة"}<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); }} /></label><span className="text-[10px] text-[#849184]">JPG أو PNG أو WebP، حتى 5MB</span></div></div>;
}

export default function Admin() {
  const [location, setLocation] = useLocation();
  const section = sectionFromPath(location);
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const catalog = trpc.catalog.get.useQuery(undefined, { staleTime: 20_000 });
  const overview = trpc.catalog.admin.overview.useQuery(undefined, { retry: false, enabled: user?.role === "admin" });
  const productsQuery = trpc.catalog.admin.products.useQuery(undefined, { retry: false, enabled: user?.role === "admin" });
  const servicesQuery = trpc.catalog.admin.services.useQuery(undefined, { retry: false, enabled: user?.role === "admin" });
  const [settings, setSettings] = useState<SettingsDraft>(fallbackSettings);
  const [productModal, setProductModal] = useState(false);
  const [serviceModal, setServiceModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [productDraft, setProductDraft] = useState<ProductDraft>(emptyProduct);
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>(emptyService);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  useEffect(() => {
    if (catalog.data?.settings) setSettings(catalog.data.settings);
  }, [catalog.data?.settings]);

  const saveSettings = trpc.catalog.admin.saveSettings.useMutation({ onSuccess: async () => { await utils.catalog.get.invalidate(); toast.success("تم حفظ إعدادات الواجهة"); }, onError: (error) => toast.error(error.message) });
  const createProduct = trpc.catalog.admin.createProduct.useMutation({ onSuccess: async () => { await Promise.all([utils.catalog.admin.products.invalidate(), utils.catalog.get.invalidate(), utils.catalog.admin.overview.invalidate()]); setProductModal(false); toast.success("تمت إضافة المنتج"); }, onError: (error) => toast.error(error.message) });
  const updateProduct = trpc.catalog.admin.updateProduct.useMutation({ onSuccess: async () => { await Promise.all([utils.catalog.admin.products.invalidate(), utils.catalog.get.invalidate()]); setProductModal(false); toast.success("تم حفظ التعديلات"); }, onError: (error) => toast.error(error.message) });
  const deleteProduct = trpc.catalog.admin.deleteProduct.useMutation({ onSuccess: async () => { await Promise.all([utils.catalog.admin.products.invalidate(), utils.catalog.get.invalidate(), utils.catalog.admin.overview.invalidate()]); toast.success("تم حذف المنتج"); }, onError: (error) => toast.error(error.message) });
  const createService = trpc.catalog.admin.createService.useMutation({ onSuccess: async () => { await Promise.all([utils.catalog.admin.services.invalidate(), utils.catalog.get.invalidate(), utils.catalog.admin.overview.invalidate()]); setServiceModal(false); toast.success("تمت إضافة الخدمة"); }, onError: (error) => toast.error(error.message) });
  const updateService = trpc.catalog.admin.updateService.useMutation({ onSuccess: async () => { await Promise.all([utils.catalog.admin.services.invalidate(), utils.catalog.get.invalidate()]); setServiceModal(false); toast.success("تم حفظ التعديلات"); }, onError: (error) => toast.error(error.message) });
  const deleteService = trpc.catalog.admin.deleteService.useMutation({ onSuccess: async () => { await Promise.all([utils.catalog.admin.services.invalidate(), utils.catalog.get.invalidate(), utils.catalog.admin.overview.invalidate()]); toast.success("تم حذف الخدمة"); }, onError: (error) => toast.error(error.message) });
  const upload = trpc.catalog.admin.uploadImage.useMutation({ onError: (error) => toast.error(error.message) });

  const busy = saveSettings.isPending || createProduct.isPending || updateProduct.isPending || createService.isPending || updateService.isPending;
  const metrics = useMemo(() => overview.data ?? { products: 0, activeProducts: 0, services: 0, activeServices: 0 }, [overview.data]);

  const uploadFile = async (file: File, target: "hero" | "map" | "product") => {
    if (file.size > 5_000_000) { toast.error("حجم الصورة يتجاوز 5 ميغابايت."); return; }
    setUploadingTarget(target);
    try {
      const base64 = await fileToBase64(file);
      const result = await upload.mutateAsync({ filename: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64 });
      if (target === "hero") setSettings((previous) => ({ ...previous, heroImageUrl: result.url, heroImageKey: result.key }));
      if (target === "map") setSettings((previous) => ({ ...previous, mapImageUrl: result.url, mapImageKey: result.key }));
      if (target === "product") setProductDraft((previous) => ({ ...previous, imageUrl: result.url, imageKey: result.key }));
      toast.success("تم رفع الصورة، لا تنسَ حفظ التغييرات.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة."); }
    finally { setUploadingTarget(null); }
  };

  const openProduct = (product?: NonNullable<typeof productsQuery.data>[number]) => {
    if (product) { setEditingProductId(product.id); setProductDraft({ name: product.name, category: product.category, farm: product.farm, location: product.location, price: product.price, availability: product.availability, imageUrl: product.imageUrl, imageKey: product.imageKey, status: product.status }); }
    else { setEditingProductId(null); setProductDraft(emptyProduct); }
    setProductModal(true);
  };

  const openService = (service?: NonNullable<typeof servicesQuery.data>[number]) => {
    if (service) { setEditingServiceId(service.id); setServiceDraft({ title: service.title, description: service.description, icon: service.icon as ServiceDraft["icon"], sortOrder: service.sortOrder, status: service.status }); }
    else { setEditingServiceId(null); setServiceDraft({ ...emptyService, sortOrder: (servicesQuery.data?.length ?? 0) + 1 }); }
    setServiceModal(true);
  };

  if (loading) return <div className="min-h-screen grid place-items-center bg-[#f8f6ec] text-[#1c6b3c]"><Loader2 className="animate-spin" /></div>;
  if (!user) return <div className="min-h-screen grid place-items-center bg-[#f8f6ec] p-6 text-center" dir="rtl"><div className="max-w-md rounded-[26px] border border-[#dce8d5] bg-white p-9 shadow-xl"><ShieldCheck className="mx-auto mb-4 text-[#1c6b3c]" size={39} /><h1 className="font-['Noto_Kufi_Arabic'] text-xl font-bold text-[#123c25]">لوحة الإدارة محمية</h1><p className="mt-3 text-sm leading-7 text-[#667168]">سجّل الدخول أولًا لتعديل المنتجات والخدمات والمظهر من داخل الموقع.</p><button onClick={() => startLogin()} className="mt-6 rounded-xl bg-[#1c6b3c] px-5 py-3 text-sm font-bold text-white">تسجيل الدخول</button></div></div>;
  if (user.role !== "admin") return <div className="min-h-screen grid place-items-center bg-[#f8f6ec] p-6 text-center" dir="rtl"><div className="max-w-md rounded-[26px] border border-[#f1d2cc] bg-white p-9 shadow-xl"><ShieldCheck className="mx-auto mb-4 text-[#c45345]" size={39} /><h1 className="font-['Noto_Kufi_Arabic'] text-xl font-bold text-[#4a261f]">ليس لديك صلاحية الإدارة</h1><p className="mt-3 text-sm leading-7 text-[#667168]">هذه المساحة مخصصة لمالك الموقع والمشرفين فقط.</p><button onClick={() => setLocation("/")} className="mt-6 rounded-xl bg-[#1c6b3c] px-5 py-3 text-sm font-bold text-white">العودة للموقع</button></div></div>;

  return <DashboardLayout><div className="mx-auto w-full max-w-6xl" dir="rtl"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="inline-flex items-center gap-2 text-xs font-bold text-[#1c6b3c]"><span className="h-2 w-2 rounded-full bg-[#d9553f]" />لوحة التعديل</span><h1 className="mt-2 font-['Noto_Kufi_Arabic'] text-2xl font-extrabold tracking-tight text-[#123c25]">{section === "overview" ? "مرحبًا، خلّ الخير يتحرك." : section === "products" ? "إدارة المنتجات" : section === "services" ? "إدارة الخدمات" : "المظهر ومحتوى الموقع"}</h1><p className="mt-2 text-sm text-[#728078]">كل تعديل تحفظه هنا ينعكس على الواجهة العامة مباشرة.</p></div><div className="flex gap-2"><button onClick={() => window.open("/", "_blank")} className="inline-flex items-center gap-2 rounded-xl border border-[#d8e5d1] bg-white px-3 py-2 text-xs font-bold text-[#1c6b3c]"><Eye size={15} />عرض الموقع</button><button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 rounded-xl bg-[#1c6b3c] px-3 py-2 text-xs font-bold text-white"><ArrowUpLeft size={15} />الواجهة العامة</button></div></div>

    {section === "overview" && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={PackageCheck} label="كل المنتجات" value={metrics.products} tint="#e7f0e1" /><Metric icon={Leaf} label="منتجات ظاهرة" value={metrics.activeProducts} tint="#eef4df" /><Metric icon={Truck} label="كل الخدمات" value={metrics.services} tint="#f9eedb" /><Metric icon={Recycle} label="خدمات ظاهرة" value={metrics.activeServices} tint="#f0e8da" /></div><div className="grid gap-4 lg:grid-cols-2"><QuickCard title="أضف محصولًا جديدًا" text="أنشئ بطاقة منتج كاملة مع السعر، المزرعة، الصورة وحالة الظهور." action="إدارة المنتجات" icon={Plus} onClick={() => setLocation("/admin/products")} /><QuickCard title="حرّر قصة الواجهة" text="عدّل العنوان، الألوان، صور الغلاف والخريطة دون فتح الكود." action="فتح المظهر" icon={Palette} onClick={() => setLocation("/admin/appearance")} /></div></div>}

    {section === "products" && <section className="rounded-[22px] border border-[#e0e9dc] bg-white shadow-[0_10px_34px_rgba(24,55,34,.05)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1eb] p-5"><div><h2 className="font-['Noto_Kufi_Arabic'] text-base font-bold text-[#123c25]">العروض الزراعية</h2><p className="mt-1 text-xs text-[#738078]">أضف، أخفِ، أو عدّل البطاقات التي تظهر للزوار.</p></div><button onClick={() => openProduct()} className="inline-flex items-center gap-2 rounded-xl bg-[#1c6b3c] px-4 py-2.5 text-xs font-bold text-white"><Plus size={16} />إضافة منتج</button></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-right"><thead className="bg-[#f8faf5] text-xs text-[#6d7b70]"><tr><th className="px-5 py-4 font-semibold">المنتج</th><th className="px-4 py-4 font-semibold">المزرعة / الموقع</th><th className="px-4 py-4 font-semibold">السعر</th><th className="px-4 py-4 font-semibold">الحالة</th><th className="px-5 py-4 text-left font-semibold">إجراءات</th></tr></thead><tbody>{productsQuery.isLoading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[#7a877c]">جاري تحميل المنتجات…</td></tr> : productsQuery.data?.length ? productsQuery.data.map((product) => <tr key={product.id} className="border-t border-[#edf1eb] text-sm"><td className="px-5 py-3"><div className="flex items-center gap-3"><img src={product.imageUrl || "/manus-storage/walo-produce_04591401.jpg"} alt="" className="h-10 w-12 rounded-lg object-cover" /><div><strong className="block text-[#123c25]">{product.name}</strong><span className="text-[11px] text-[#7e8a80]">{product.category} · {product.availability}</span></div></div></td><td className="px-4 py-3 text-xs text-[#637267]"><strong className="block font-medium text-[#455a4c]">{product.farm}</strong>{product.location}</td><td className="px-4 py-3 text-xs font-bold text-[#1c6b3c]">{product.price}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${product.status === "active" ? "bg-[#e6f1df] text-[#1c6b3c]" : "bg-[#f2ece4] text-[#96714a]"}`}>{product.status === "active" ? "ظاهر" : "مخفي"}</span></td><td className="px-5 py-3"><div className="flex justify-end gap-2"><button onClick={() => openProduct(product)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf4e8] text-[#1c6b3c]" aria-label="تعديل"><Pencil size={14} /></button><button onClick={() => { if (window.confirm(`حذف «${product.name}»؟`)) deleteProduct.mutate({ id: product.id }); }} className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff0ed] text-[#be5145]" aria-label="حذف"><Trash2 size={14} /></button></div></td></tr>) : <tr><td colSpan={5} className="px-5 py-14 text-center"><PackageCheck className="mx-auto mb-3 text-[#a9c4a2]" /><p className="font-['Noto_Kufi_Arabic'] text-sm font-bold text-[#314a37]">لا توجد منتجات مدارة بعد</p><p className="mt-2 text-xs text-[#748176]">أضف أول محصول حقيقي من الزر أعلاه، وسيظهر تلقائيًا في الصفحة العامة.</p></td></tr>}</tbody></table></div></section>}

    {section === "services" && <section className="rounded-[22px] border border-[#e0e9dc] bg-white shadow-[0_10px_34px_rgba(24,55,34,.05)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1eb] p-5"><div><h2 className="font-['Noto_Kufi_Arabic'] text-base font-bold text-[#123c25]">الخدمات</h2><p className="mt-1 text-xs text-[#738078]">تحكّم بنصوص المسارات التي تشرح النقل والتوفير وإعادة التوزيع.</p></div><button onClick={() => openService()} className="inline-flex items-center gap-2 rounded-xl bg-[#1c6b3c] px-4 py-2.5 text-xs font-bold text-white"><Plus size={16} />إضافة خدمة</button></div><div className="divide-y divide-[#edf1eb]">{servicesQuery.isLoading ? <p className="p-8 text-center text-sm text-[#7a877c]">جاري تحميل الخدمات…</p> : servicesQuery.data?.length ? servicesQuery.data.map((service) => <div key={service.id} className="flex flex-wrap items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf4e8] text-[#1c6b3c]"><ServiceIcon icon={service.icon} /></span><div className="min-w-[200px] flex-1"><strong className="block text-sm text-[#123c25]">{service.title}</strong><p className="mt-1 text-xs text-[#738078]">{service.description}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${service.status === "active" ? "bg-[#e6f1df] text-[#1c6b3c]" : "bg-[#f2ece4] text-[#96714a]"}`}>{service.status === "active" ? "ظاهر" : "مخفي"}</span><div className="flex gap-2"><button onClick={() => openService(service)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf4e8] text-[#1c6b3c]"><Pencil size={14} /></button><button onClick={() => { if (window.confirm(`حذف «${service.title}»؟`)) deleteService.mutate({ id: service.id }); }} className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff0ed] text-[#be5145]"><Trash2 size={14} /></button></div></div>) : <div className="p-14 text-center"><Truck className="mx-auto mb-3 text-[#a9c4a2]" /><p className="font-['Noto_Kufi_Arabic'] text-sm font-bold text-[#314a37]">لا توجد خدمات مدارة بعد</p><p className="mt-2 text-xs text-[#748176]">أضف خدمة جديدة أو ابدأ بتحرير نصوص الواجهة.</p></div>}</div></section>}

    {section === "appearance" && <section className="rounded-[22px] border border-[#e0e9dc] bg-white p-5 shadow-[0_10px_34px_rgba(24,55,34,.05)]"><div className="mb-6"><h2 className="font-['Noto_Kufi_Arabic'] text-base font-bold text-[#123c25]">الهوية ومحتوى الصفحة</h2><p className="mt-1 text-xs text-[#738078]">حرّر النصوص والصور والألوان التي يراها زوّار الموقع.</p></div><div className="grid gap-x-4 gap-y-5 md:grid-cols-2"><Field label="شريط الإعلان" wide><input className="admin-input" value={settings.announcementText} onChange={(event) => setSettings({ ...settings, announcementText: event.target.value })} /></Field><Field label="شارة الواجهة"><input className="admin-input" value={settings.heroBadge} onChange={(event) => setSettings({ ...settings, heroBadge: event.target.value })} /></Field><Field label="بداية العنوان الرئيسي"><input className="admin-input" value={settings.heroTitle} onChange={(event) => setSettings({ ...settings, heroTitle: event.target.value })} /></Field><Field label="الكلمة المميزة"><input className="admin-input" value={settings.heroAccent} onChange={(event) => setSettings({ ...settings, heroAccent: event.target.value })} /></Field><Field label="وصف الواجهة" wide><textarea className="admin-input min-h-24 resize-y" value={settings.heroDescription} onChange={(event) => setSettings({ ...settings, heroDescription: event.target.value })} /></Field><Field label="زر الواجهة"><input className="admin-input" value={settings.heroCta} onChange={(event) => setSettings({ ...settings, heroCta: event.target.value })} /></Field><Field label="عنوان المنتجات"><input className="admin-input" value={settings.productsTitle} onChange={(event) => setSettings({ ...settings, productsTitle: event.target.value })} /></Field><Field label="تسمية الخدمات"><input className="admin-input" value={settings.servicesLabel} onChange={(event) => setSettings({ ...settings, servicesLabel: event.target.value })} /></Field><Field label="عنوان الخدمات"><input className="admin-input" value={settings.servicesTitle} onChange={(event) => setSettings({ ...settings, servicesTitle: event.target.value })} /></Field><Field label="عنوان الأثر"><input className="admin-input" value={settings.impactTitle} onChange={(event) => setSettings({ ...settings, impactTitle: event.target.value })} /></Field><Field label="عنوان فوكال"><input className="admin-input" value={settings.assistantTitle} onChange={(event) => setSettings({ ...settings, assistantTitle: event.target.value })} /></Field><Field label="بريد التواصل"><input className="admin-input" dir="ltr" value={settings.supportEmail} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} /></Field><Field label="اللون الرئيسي"><div className="flex gap-2"><input className="h-10 w-12 rounded-lg border border-[#d9e5d4] p-1" type="color" value={settings.primaryColor} onChange={(event) => setSettings({ ...settings, primaryColor: event.target.value })} /><input className="admin-input flex-1" dir="ltr" value={settings.primaryColor} onChange={(event) => setSettings({ ...settings, primaryColor: event.target.value })} /></div></Field><Field label="اللون المميز"><div className="flex gap-2"><input className="h-10 w-12 rounded-lg border border-[#d9e5d4] p-1" type="color" value={settings.accentColor} onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })} /><input className="admin-input flex-1" dir="ltr" value={settings.accentColor} onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })} /></div></Field><ImagePicker label="صورة الواجهة الرئيسية" value={settings.heroImageUrl} uploading={uploadingTarget === "hero"} onUpload={(file) => uploadFile(file, "hero")} /><ImagePicker label="صورة الخريطة" value={settings.mapImageUrl} uploading={uploadingTarget === "map"} onUpload={(file) => uploadFile(file, "map")} /></div><div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1eb] pt-5"><span className="text-xs text-[#718075]">تُحفظ التعديلات ثم تظهر في واجهة الزائر دون إعادة بناء الموقع.</span><button disabled={busy} onClick={() => saveSettings.mutate(settings)} className="inline-flex items-center gap-2 rounded-xl bg-[#1c6b3c] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"><Save size={15} />{saveSettings.isPending ? "جاري الحفظ…" : "حفظ التغييرات"}</button></div></section>}

    {productModal && <AdminModal title={editingProductId ? "تعديل المنتج" : "إضافة منتج"} onClose={() => setProductModal(false)}><div className="grid gap-4 md:grid-cols-2"><Field label="اسم المنتج"><input className="admin-input" value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })} /></Field><Field label="التصنيف"><input className="admin-input" value={productDraft.category} onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })} /></Field><Field label="المزرعة"><input className="admin-input" value={productDraft.farm} onChange={(event) => setProductDraft({ ...productDraft, farm: event.target.value })} /></Field><Field label="المنطقة"><input className="admin-input" value={productDraft.location} onChange={(event) => setProductDraft({ ...productDraft, location: event.target.value })} /></Field><Field label="السعر"><input className="admin-input" value={productDraft.price} onChange={(event) => setProductDraft({ ...productDraft, price: event.target.value })} placeholder="مثال: 35 دج / كغ" /></Field><Field label="عبارة التوفر"><input className="admin-input" value={productDraft.availability} onChange={(event) => setProductDraft({ ...productDraft, availability: event.target.value })} /></Field><Field label="حالة الظهور"><select className="admin-input" value={productDraft.status} onChange={(event) => setProductDraft({ ...productDraft, status: event.target.value as ProductDraft["status"] })}><option value="active">ظاهر للزوار</option><option value="hidden">مخفي مؤقتًا</option></select></Field><ImagePicker label="صورة المنتج" value={productDraft.imageUrl} uploading={uploadingTarget === "product"} onUpload={(file) => uploadFile(file, "product")} /></div><div className="mt-6 flex justify-end gap-2"><button onClick={() => setProductModal(false)} className="rounded-xl border border-[#d9e5d4] px-4 py-2.5 text-xs font-bold text-[#607265]">إلغاء</button><button disabled={busy} onClick={() => editingProductId ? updateProduct.mutate({ id: editingProductId, data: productDraft }) : createProduct.mutate(productDraft)} className="inline-flex items-center gap-2 rounded-xl bg-[#1c6b3c] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"><Save size={15} />{busy ? "جاري الحفظ…" : "حفظ المنتج"}</button></div></AdminModal>}
    {serviceModal && <AdminModal title={editingServiceId ? "تعديل الخدمة" : "إضافة خدمة"} onClose={() => setServiceModal(false)}><div className="grid gap-4 md:grid-cols-2"><Field label="اسم الخدمة" wide><input className="admin-input" value={serviceDraft.title} onChange={(event) => setServiceDraft({ ...serviceDraft, title: event.target.value })} /></Field><Field label="الوصف" wide><textarea className="admin-input min-h-24 resize-y" value={serviceDraft.description} onChange={(event) => setServiceDraft({ ...serviceDraft, description: event.target.value })} /></Field><Field label="الأيقونة"><select className="admin-input" value={serviceDraft.icon} onChange={(event) => setServiceDraft({ ...serviceDraft, icon: event.target.value as ServiceDraft["icon"] })}><option value="Truck">شاحنة نقل</option><option value="PackageCheck">صندوق توفير</option><option value="Recycle">إعادة توزيع</option><option value="Leaf">ورقة زراعية</option></select></Field><Field label="ترتيب العرض"><input className="admin-input" type="number" min="0" value={serviceDraft.sortOrder} onChange={(event) => setServiceDraft({ ...serviceDraft, sortOrder: Number(event.target.value) })} /></Field><Field label="الحالة"><select className="admin-input" value={serviceDraft.status} onChange={(event) => setServiceDraft({ ...serviceDraft, status: event.target.value as ServiceDraft["status"] })}><option value="active">ظاهر للزوار</option><option value="hidden">مخفي مؤقتًا</option></select></Field></div><div className="mt-6 flex justify-end gap-2"><button onClick={() => setServiceModal(false)} className="rounded-xl border border-[#d9e5d4] px-4 py-2.5 text-xs font-bold text-[#607265]">إلغاء</button><button disabled={busy} onClick={() => editingServiceId ? updateService.mutate({ id: editingServiceId, data: serviceDraft }) : createService.mutate(serviceDraft)} className="inline-flex items-center gap-2 rounded-xl bg-[#1c6b3c] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"><Save size={15} />{busy ? "جاري الحفظ…" : "حفظ الخدمة"}</button></div></AdminModal>}
  </div></DashboardLayout>;
}

function Metric({ icon: Icon, label, value, tint }: { icon: typeof Leaf; label: string; value: number; tint: string }) { return <div className="rounded-[20px] border border-[#e2eadc] bg-white p-5 shadow-[0_8px_24px_rgba(24,55,34,.04)]"><span className="mb-5 grid h-10 w-10 place-items-center rounded-xl text-[#1c6b3c]" style={{ background: tint }}><Icon size={19} /></span><strong className="font-['Noto_Kufi_Arabic'] text-2xl text-[#123c25]">{value}</strong><span className="mt-1 block text-xs text-[#738078]">{label}</span></div>; }
function QuickCard({ title, text, action, icon: Icon, onClick }: { title: string; text: string; action: string; icon: typeof Plus; onClick: () => void }) { return <button onClick={onClick} className="group flex w-full items-start gap-4 rounded-[21px] border border-[#dce8d6] bg-[#f8fbf5] p-5 text-right transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#1c6b3c] text-white"><Icon size={19} /></span><span className="flex-1"><strong className="block font-['Noto_Kufi_Arabic'] text-sm text-[#123c25]">{title}</strong><span className="mt-2 block text-xs leading-6 text-[#748176]">{text}</span><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1c6b3c]">{action}<ArrowUpLeft size={14} /></span></span></button>; }
function ServiceIcon({ icon }: { icon: string }) { if (icon === "PackageCheck") return <PackageCheck size={19} />; if (icon === "Recycle") return <Recycle size={19} />; if (icon === "Leaf") return <Leaf size={19} />; return <Truck size={19} />; }
