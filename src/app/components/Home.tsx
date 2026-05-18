import { Link } from "react-router-dom";
import { BookOpen, ShoppingCart, Briefcase, Trophy, Mic, ArrowLeft } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "الدورات التدريبية",
    description: "دورات مجانية ومدفوعة في جميع مجالات الإعلام",
    link: "/courses",
    delay: "0.1s",
  },
  {
    icon: ShoppingCart,
    title: "متجر العتاد",
    description: "بيع وشراء معدات الإعلام الاحترافية",
    link: "/equipment",
    delay: "0.2s",
  },
  {
    icon: Briefcase,
    title: "عروض التوظيف",
    description: "فرص عمل إعلامية وصحفية في الجزائر",
    link: "/jobs",
    delay: "0.3s",
  },
  {
    icon: Trophy,
    title: "المسابقات",
    description: "مواعيد المسابقات الإعلامية الجامعية والوطنية",
    link: "/competitions",
    delay: "0.4s",
  },
  {
    icon: Mic,
    title: "طلبات المنشطين",
    description: "ابحث عن منشطين ومعلقين صوتيين محترفين",
    link: "/voice-requests",
    delay: "0.5s",
  },
];

export default function Home() {
  return (
    <div style={{ background: "#0b0f0b", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-24 px-4"
        style={{
          background: "linear-gradient(180deg, #060a06 0%, #0b0f0b 100%)",
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 bg-grid-pattern"
          style={{ opacity: 0.4 }}
        />

        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% -10%, rgba(0,98,51,0.2) 0%, transparent 65%)",
          }}
        />

        {/* Decorative circles */}
        <div
          className="absolute top-16 left-1/4 w-64 h-64 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #00a355, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #006233, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 animate-fade-in"
            style={{
              border: "1px solid rgba(0,163,85,0.3)",
              background: "rgba(0,98,51,0.1)",
              color: "#4caf50",
              fontSize: "0.8rem",
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#00a355" }}
            />
            المنصة الجزائرية الإعلامية الشاملة
          </div>

          {/* Main heading */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up"
            style={{
              color: "#e8f5e9",
              lineHeight: "1.2",
              animationDelay: "0.1s",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            مرحباً بكم في{" "}
            <span className="text-shimmer">سند</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up"
            style={{
              color: "#6aad6a",
              animationDelay: "0.25s",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            المنصة الجزائرية الشاملة لكل شغوف بمجال الإعلام —
            دورات، معدات، وظائف، مسابقات، ومنشطون
          </p>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{
              animationDelay: "0.4s",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            <Link
              to="/courses"
              className="btn-dz inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium"
              style={{ textDecoration: "none" }}
            >
              <span>ابدأ الآن</span>
              <ArrowLeft size={18} />
            </Link>
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300"
              style={{
                border: "1px solid rgba(0,98,51,0.4)",
                color: "#81c784",
                background: "transparent",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(0,98,51,0.12)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,163,85,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,98,51,0.4)";
              }}
            >
              اكتشف الفرص
            </Link>
          </div>
        </div>

        {/* Bottom divider */}
        <div
          className="absolute bottom-0 right-0 left-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0,98,51,0.4), transparent)",
          }}
        />
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <h2
              className="text-3xl font-bold mb-3"
              style={{ color: "#e8f5e9" }}
            >
              خدمات المنصة
            </h2>
            <div
              className="h-px w-24 mx-auto"
              style={{
                background: "linear-gradient(90deg, transparent, #006233, #00a355, transparent)",
              }}
            />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.link}
                  to={feature.link}
                  className="group card-glow rounded-xl p-6 animate-fade-in-up"
                  style={{
                    background: "linear-gradient(145deg, #0f1a0f, #0b150b)",
                    textDecoration: "none",
                    animationDelay: feature.delay,
                    opacity: 0,
                    animationFillMode: "forwards",
                    display: "block",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,98,51,0.3), rgba(0,133,69,0.2))",
                      border: "1px solid rgba(0,98,51,0.4)",
                    }}
                  >
                    <Icon
                      size={26}
                      style={{ color: "#00a355" }}
                      className="icon-glow"
                    />
                  </div>

                  {/* Content */}
                  <h3
                    className="text-xl font-semibold mb-2 transition-colors duration-300 group-hover:text-green-400"
                    style={{ color: "#c8e6c9" }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ color: "#4a7a4a", fontSize: "0.9rem", lineHeight: "1.6" }}>
                    {feature.description}
                  </p>

                  {/* Arrow indicator */}
                  <div
                    className="flex items-center gap-1 mt-4 transition-all duration-300 group-hover:gap-2"
                    style={{ color: "#006233", fontSize: "0.8rem" }}
                  >
                    <span>استكشف</span>
                    <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section
        className="py-12 px-4"
        style={{
          background: "linear-gradient(135deg, #060a06, #0b150b)",
          borderTop: "1px solid rgba(0,98,51,0.15)",
          borderBottom: "1px solid rgba(0,98,51,0.15)",
        }}
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "٥+", label: "خدمات متكاملة" },
              { value: "٣٦", label: "ولاية مشمولة" },
              { value: "٢٤/٧", label: "متاح دائماً" },
              { value: "١٠٠٪", label: "جزائري أصيل" },
            ].map((stat, i) => (
              <div
                key={i}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${0.1 * i}s`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div
                  className="text-3xl font-bold mb-1"
                  style={{ color: "#00a355" }}
                >
                  {stat.value}
                </div>
                <div style={{ color: "#4a7a4a", fontSize: "0.85rem" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
