import { Search, Filter } from "lucide-react";

export default function Courses() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl mb-4">الدورات التدريبية</h1>
        <p className="text-gray-600">
          اكتشف دورات تدريبية مجانية ومدفوعة في مجال الإعلام
        </p>
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
              placeholder="ابحث عن دورة..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">نوع الدورة</option>
              <option value="free">مجانية</option>
              <option value="paid">مدفوعة</option>
            </select>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Filter size={20} />
              تصفية
            </button>
          </div>
        </div>
      </div>

      <div className="text-center py-16 text-gray-500">
        لا توجد دورات متاحة حالياً. سيتم إضافة الدورات عبر لوحة التحكم.
      </div>
    </div>
  );
}
