import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Briefcase,
  Trophy,
  Mic,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

type Section =
  | "overview"
  | "courses"
  | "equipment"
  | "jobs"
  | "competitions"
  | "voice"
  | "settings";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const navigate = useNavigate();

  const menuItems = [
    { id: "overview" as Section, label: "نظرة عامة", icon: LayoutDashboard },
    { id: "courses" as Section, label: "الدورات", icon: BookOpen },
    { id: "equipment" as Section, label: "العتاد", icon: ShoppingCart },
    { id: "jobs" as Section, label: "الوظائف", icon: Briefcase },
    { id: "competitions" as Section, label: "المسابقات", icon: Trophy },
    { id: "voice" as Section, label: "طلبات المنشطين", icon: Mic },
    { id: "settings" as Section, label: "الإعدادات", icon: Settings },
  ];

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="flex">
        <aside className="w-64 bg-emerald-800 text-white min-h-screen p-4 flex flex-col">
          <div className="mb-8">
            <h2 className="text-2xl">سند Admin</h2>
            <p className="text-sm text-emerald-200">لوحة التحكم</p>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-emerald-700"
                      : "hover:bg-emerald-700/50"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="space-y-2">
            <Link
              to="/"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-700/50 transition-colors"
            >
              <LayoutDashboard size={20} />
              عرض الموقع
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-700/50 transition-colors"
            >
              <LogOut size={20} />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl mb-2">
              {menuItems.find((item) => item.id === activeSection)?.label}
            </h1>
            <p className="text-gray-600">إدارة ومتابعة المحتوى</p>
          </div>

          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "courses" && <CoursesSection />}
          {activeSection === "equipment" && <EquipmentSection />}
          {activeSection === "jobs" && <JobsSection />}
          {activeSection === "competitions" && <CompetitionsSection />}
          {activeSection === "voice" && <VoiceSection />}
          {activeSection === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

function OverviewSection() {
  const stats = [
    { label: "إجمالي الدورات", value: "0", color: "bg-blue-500" },
    { label: "المنتجات المتاحة", value: "0", color: "bg-green-500" },
    { label: "عروض التوظيف", value: "0", color: "bg-purple-500" },
    { label: "المسابقات", value: "0", color: "bg-orange-500" },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow-md">
            <div
              className={`w-12 h-12 ${stat.color} rounded-lg mb-4 flex items-center justify-center text-white`}
            >
              <span className="text-2xl">{stat.value}</span>
            </div>
            <p className="text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl mb-4">نشاطات حديثة</h3>
        <p className="text-gray-500">لا توجد نشاطات حالياً</p>
      </div>
    </div>
  );
}

function CoursesSection() {
  return (
    <div>
      <div className="mb-6">
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Plus size={20} />
          إضافة دورة جديدة
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right pb-3">العنوان</th>
                  <th className="text-right pb-3">النوع</th>
                  <th className="text-right pb-3">المدة</th>
                  <th className="text-right pb-3">الحالة</th>
                  <th className="text-right pb-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد دورات. انقر على "إضافة دورة جديدة" للبدء.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function EquipmentSection() {
  return (
    <div>
      <div className="mb-6">
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Plus size={20} />
          إضافة منتج جديد
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right pb-3">المنتج</th>
                  <th className="text-right pb-3">الفئة</th>
                  <th className="text-right pb-3">السعر</th>
                  <th className="text-right pb-3">البائع</th>
                  <th className="text-right pb-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد منتجات. انقر على "إضافة منتج جديد" للبدء.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobsSection() {
  return (
    <div>
      <div className="mb-6">
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Plus size={20} />
          إضافة عرض توظيف
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right pb-3">المسمى الوظيفي</th>
                  <th className="text-right pb-3">الجهة</th>
                  <th className="text-right pb-3">الموقع</th>
                  <th className="text-right pb-3">تاريخ النشر</th>
                  <th className="text-right pb-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد عروض توظيف. انقر على "إضافة عرض توظيف" للبدء.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompetitionsSection() {
  return (
    <div>
      <div className="mb-6">
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Plus size={20} />
          إضافة مسابقة
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right pb-3">اسم المسابقة</th>
                  <th className="text-right pb-3">النوع</th>
                  <th className="text-right pb-3">تاريخ البداية</th>
                  <th className="text-right pb-3">تاريخ النهاية</th>
                  <th className="text-right pb-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد مسابقات. انقر على "إضافة مسابقة" للبدء.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceSection() {
  return (
    <div>
      <div className="mb-6">
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Plus size={20} />
          إضافة طلب منشط
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right pb-3">الاسم</th>
                  <th className="text-right pb-3">التخصص</th>
                  <th className="text-right pb-3">سنوات الخبرة</th>
                  <th className="text-right pb-3">الحالة</th>
                  <th className="text-right pb-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد طلبات. انقر على "إضافة طلب منشط" للبدء.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl mb-4">إعدادات الموقع</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">اسم الموقع</label>
            <input
              type="text"
              defaultValue="سند"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">وصف الموقع</label>
            <textarea
              defaultValue="المنصة الجزائرية الشاملة لكل شغوف بمجال الإعلام"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl mb-4">أسماء الصفحات</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">صفحة الدورات</label>
            <input
              type="text"
              defaultValue="الدورات التدريبية"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">صفحة العتاد</label>
            <input
              type="text"
              defaultValue="متجر العتاد"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">صفحة الوظائف</label>
            <input
              type="text"
              defaultValue="عروض التوظيف"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
        حفظ التغييرات
      </button>
    </div>
  );
}
