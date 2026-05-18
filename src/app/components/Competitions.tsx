import { Search, Calendar, Trophy } from "lucide-react";

export default function Competitions() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl mb-4">المسابقات الإعلامية</h1>
        <p className="text-gray-600">
          مواعيد المسابقات الإعلامية الجامعية والوطنية
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
              placeholder="ابحث عن مسابقة..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">نوع المسابقة</option>
            <option value="university">جامعية</option>
            <option value="national">وطنية</option>
            <option value="international">دولية</option>
          </select>
        </div>
      </div>

      <div className="text-center py-16 text-gray-500">
        لا توجد مسابقات حالياً. سيتم إضافة المسابقات عبر لوحة التحكم.
      </div>
    </div>
  );
}
