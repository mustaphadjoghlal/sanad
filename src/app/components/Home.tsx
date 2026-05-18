import { Link } from "react-router-dom";
import { BookOpen, ShoppingCart, Briefcase, Trophy, Mic } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: "الدورات التدريبية",
      description: "دورات مجانية ومدفوعة في جميع مجالات الإعلام",
      link: "/courses",
    },
    {
      icon: ShoppingCart,
      title: "متجر العتاد",
      description: "بيع وشراء معدات الإعلام الاحترافية",
      link: "/equipment",
    },
    {
      icon: Briefcase,
      title: "عروض التوظيف",
      description: "فرص عمل إعلامية وصحفية في الجزائر",
      link: "/jobs",
    },
    {
      icon: Trophy,
      title: "المسابقات",
      description: "مواعيد المسابقات الإعلامية الجامعية والوطنية",
      link: "/competitions",
    },
    {
      icon: Mic,
      title: "طلبات المنشطين",
      description: "ابحث عن منشطين ومعلقين صوتيين محترفين",
      link: "/voice-requests",
    },
  ];

  return (
    <div>
      <section className="bg-gradient-to-b from-emerald-50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl mb-4">مرحبا بكم في سند</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            المنصة الجزائرية الشاملة لكل شغوف بمجال الإعلام
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.link}
                  to={feature.link}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <Icon className="text-emerald-600" size={28} />
                    </div>
                    <h3 className="text-xl">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
