import { Search, Store } from "lucide-react";

export default function Equipment() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl mb-4">متجر عتاد الإعلام</h1>
        <p className="text-gray-600">
          تسوق معدات الإعلام الاحترافية أو افتح متجرك الخاص
        </p>
      </div>

      <div className="bg-emerald-50 p-6 rounded-lg mb-8 border border-emerald-200">
        <div className="flex items-start gap-4">
          <Store className="text-emerald-600 flex-shrink-0" size={32} />
          <div>
            <h3 className="text-xl mb-2">هل أنت بائع محترف؟</h3>
            <p className="text-gray-700 mb-4">
              افتح متجرك الخاص على منصة سند باشتراك شهري وابدأ البيع للآلاف من
              المحترفين
            </p>
            <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              افتح متجرك الآن
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">جميع الفئات</option>
            <option value="cameras">كاميرات</option>
            <option value="microphones">ميكروفونات</option>
            <option value="lighting">إضاءة</option>
            <option value="accessories">ملحقات</option>
          </select>
        </div>
      </div>

      <div className="text-center py-16 text-gray-500">
        لا توجد منتجات متاحة حالياً. سيتم إضافة المنتجات من قبل البائعين.
      </div>
    </div>
  );
}
