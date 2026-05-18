import { Search, MapPin, Briefcase } from "lucide-react";

export default function Jobs() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl mb-4">عروض التوظيف</h1>
        <p className="text-gray-600">فرص عمل إعلامية وصحفية في الجزائر</p>
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
              placeholder="ابحث عن وظيفة..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">الولاية</option>
              <option value="algiers">الجزائر</option>
              <option value="oran">وهران</option>
              <option value="constantine">قسنطينة</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">نوع الوظيفة</option>
              <option value="journalist">صحفي</option>
              <option value="presenter">مقدم برامج</option>
              <option value="editor">محرر</option>
              <option value="cameraman">مصور</option>
            </select>
          </div>
        </div>
      </div>

      <div className="text-center py-16 text-gray-500">
        لا توجد عروض توظيف حالياً. سيتم إضافة العروض عبر لوحة التحكم.
      </div>
    </div>
  );
}
