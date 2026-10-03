import type { UserProfile, AccountType } from "./types";

/**
 * Stand-in members, for looking at the dashboard as each kind of account sees
 * it.
 *
 * Checking that a change reads well for a متجر meant registering a fake store,
 * approving it, filling it in, looking, and then deleting it — every time. So
 * nobody checked, and the parts of the dashboard that only one kind of member
 * ever sees went unlooked-at for months.
 *
 * These are invented people. Nothing here is read from or written to
 * Firestore, and the dashboard refuses to save while showing one.
 */

const BASE = {
  photo: "",
  featured: false,
  status: "approved" as const,
  createdAt: Date.parse("2026-06-12T09:00:00Z"),
  phone: "0551234567",
  location: "الجزائر",
};

export interface PreviewKind {
  /** What the admin picks it by. */
  id: string;
  label: string;
  description: string;
  profile: UserProfile;
}

const make = (id: string, type: AccountType, over: Partial<UserProfile>): UserProfile => ({
  ...BASE,
  id: `preview-${id}`,
  email: `${id}@example.test`,
  name: "حساب معاينة",
  type,
  bio: "",
  ...over,
});

export const PREVIEW_KINDS: PreviewKind[] = [
  {
    id: "journalist",
    label: "صحفي / مراسل",
    description: "الحالة الأكثر شيوعاً — عضو إعلامي عادي بملف مكتمل.",
    profile: make("journalist", "journalist", {
      name: "ياسمين بلقاسم",
      specialty: "صحافة مكتوبة",
      experience: "٥ سنوات",
      organization: "جريدة محلية",
      bio: "صحفية تغطّي الشأن المحلي والثقافي، ومراسلة سابقة لعدة منابر إلكترونية.",
      achievements: "تغطية الانتخابات المحلية ٢٠٢٤",
      availability: "available",
      services: ["كتابة التقارير", "المراسلة الميدانية"],
      secondaryTypes: ["photographer"],
      portfolio: [{ label: "تقرير منشور", url: "https://example.test/report" }],
    }),
  },
  {
    id: "voice",
    label: "معلق صوتي",
    description: "يرى قسم عيّنات الأداء الصوتي والمهارات الصوتية.",
    profile: make("voice", "voice", {
      name: "سفيان مرابط",
      specialty: "تعليق صوتي ودوبلاج",
      experience: "٨ سنوات",
      bio: "معلق صوتي للإعلانات والوثائقيات، بلهجات جزائرية وبالفصحى.",
      languages: ["العربية الفصحى", "الدارجة الجزائرية", "الفرنسية"],
      voiceStyles: ["إعلاني", "وثائقي", "سردي"],
      audioSamples: [
        { title: "إعلان تجاري", category: "إعلاني", url: "" },
        { title: "تعليق وثائقي", category: "وثائقي", url: "" },
      ],
    }),
  },
  {
    id: "store",
    label: "متجر عتاد",
    description: "حقوله مختلفة: اسم المستخدم، نوع المعدات، وصف المتجر.",
    profile: make("store", "store", {
      name: "متجر الصورة للمعدات",
      username: "alsoura",
      specialty: "كاميرات وإضاءة",
      bio: "متجر متخصص في بيع وكراء معدات التصوير والإضاءة بالجزائر العاصمة.",
      organization: "باب الوادي، الجزائر",
      storeStatus: "trial",
    }),
  },
  {
    id: "trainer",
    label: "مدرب / مركز تدريب",
    description: "حساب تدريب بدوراته.",
    profile: make("trainer", "trainer", {
      name: "مركز الإعلام للتكوين",
      specialty: "تكوين في الصحافة والمونتاج",
      experience: "١٠ سنوات",
      organization: "وهران",
      bio: "مركز تكوين معتمد في مجالات الصحافة، المونتاج، والتصوير التلفزيوني.",
      services: ["دورات حضورية", "دورات عن بعد"],
    }),
  },
  {
    id: "student",
    label: "طالب إعلام",
    description: "ملف شبه فارغ — ما يراه عضو جديد لم يملأ شيئاً بعد.",
    profile: make("student", "student", {
      name: "أمين ڨرباوي",
      specialty: "علوم الإعلام والاتصال",
      bio: "",
    }),
  },
  {
    id: "pending",
    label: "ملف قيد الانتظار",
    description: "ما يراه من سجّل ولم يُعتمد بعد.",
    profile: make("pending", "journalist", {
      name: "ملف قيد المراجعة",
      status: "pending",
      specialty: "صحافة",
      bio: "ملف لم تتم مراجعته بعد.",
    }),
  },
  {
    id: "rejected",
    label: "ملف مرفوض",
    description: "ما يراه من رُفض ملفه، مع ملاحظة الإدارة.",
    profile: make("rejected", "journalist", {
      name: "ملف مرفوض",
      status: "rejected",
      specialty: "صحافة",
      bio: "ملف ناقص.",
      rejectionNote: "الصورة الشخصية غير واضحة، والنبذة قصيرة جداً.",
    }),
  },
];

export function previewByKind(id: string | undefined): PreviewKind | undefined {
  return PREVIEW_KINDS.find((k) => k.id === id);
}
