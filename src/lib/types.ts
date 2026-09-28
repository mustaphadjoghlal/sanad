export interface Course {
  id: string;
  title: string;
  type: "free" | "paid";
  price?: number;
  duration: string;
  description: string;
  instructor: string;
  link?: string;
  image?: string;
  contentImages?: string[];
  createdAt: number;
  status?: 'pending' | 'approved' | 'rejected';
  featured?: boolean;
  submittedBy?: string;
  rejectionNote?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  employmentType?: 'fulltime' | 'parttime' | 'internship' | 'internship_paid';
  description: string;
  deadline?: string;
  contact: string;
  source?: string;
  companyDescription?: string;
  image?: string;
  contentImages?: string[];
  createdAt: number;
  status?: 'pending' | 'approved' | 'rejected';
  featured?: boolean;
  submittedBy?: string;
  rejectionNote?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  price: number;
  seller: string;
  description: string;
  condition: "new" | "used";
  contact: string;
  image?: string;
  contentImages?: string[];
  createdAt: number;
  status?: 'pending' | 'approved' | 'rejected';
  featured?: boolean;
  submittedBy?: string;
  rejectionNote?: string;
}

export interface Competition {
  id: string;
  name: string;
  type: "university" | "national" | "international";
  startDate: string;
  endDate: string;
  description: string;
  content?: string;
  organizer: string;
  organizerDescription?: string;
  targetAudience?: string;
  source?: string;
  image?: string;
  contentImages?: string[];
  link?: string;
  createdAt: number;
  status?: 'pending' | 'approved' | 'rejected';
  featured?: boolean;
  submittedBy?: string;
  rejectionNote?: string;
}

export interface VoiceArtist {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  description: string;
  contact: string;
  createdAt: number;
  status?: 'pending' | 'approved' | 'rejected';
  featured?: boolean;
  submittedBy?: string;
  rejectionNote?: string;
}

export interface ThemeSettings {
  bgMain?: string;      // legacy / auto-derived from bgCard — no longer in admin UI
  bgCard: string;
  bgCardEnd?: string;   // gradient end color for cards (optional, solid if absent)
  primaryGreen: string;
  accentGreen: string;
  textColor: string;
  cardTextColor?: string;
}

export const DEFAULT_THEME: ThemeSettings = {
  bgCard: "#141414",
  bgCardEnd: "#101010",
  primaryGreen: "#006233",
  accentGreen: "#00a355",
  textColor: "#e8f5e9",
  cardTextColor: "#c8e6c9",
};

export interface SiteContent {
  siteName: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroCta1: string;
  heroCta2: string;
  servicesLabel: string;
  servicesTitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  ctaButton2: string;
  carouselPlaceholderProducts?: string;
  carouselPlaceholderNews?: string;
  carouselPlaceholderJobs?: string;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  siteName: "",
  heroBadge: "",
  heroTitle: "",
  heroSubtitle: "",
  heroDescription: "",
  heroCta1: "",
  heroCta2: "",
  servicesLabel: "",
  servicesTitle: "",
  ctaTitle: "",
  ctaSubtitle: "",
  ctaButton: "",
  ctaButton2: "",
  carouselPlaceholderProducts: "",
  carouselPlaceholderNews: "",
  carouselPlaceholderJobs: "",
};

export type NewsCategory = 'قناة جديدة' | 'مسابقة' | 'توظيف' | 'عام';

export interface NewsImage {
  url: string;
  alt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  date: string;
  category: NewsCategory;
  image?: string;
  imageAlt?: string;
  contentImages?: NewsImage[];
  link?: string;
  createdAt: number;
}

export type ThesisSpecialty = 'إعلام واتصال' | 'صحافة' | 'سمعي بصري' | 'إعلام آلي';

export interface Thesis {
  id: string;
  title: string;
  author: string;
  year: number;
  specialty: ThesisSpecialty;
  university: string;
  abstract: string;
  supervisor?: string;
  pdfUrl?: string;
  keywords?: string[];
  createdAt: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  link?: string;
  createdAt: number;
  readBy?: string[];
  // "admin" = only visible to the admin (e.g. new registration, resubmission).
  // Missing/"all" = visible to every logged-in user (jobs, competitions, announcements).
  audience?: "all" | "admin";
}

export interface Channel {
  id: string;
  name: string;
  /**
   * A short profile of the channel, written by the admin. Optional: a channel
   * with only a frequency and an address is still a useful page, so this adds
   * to that rather than being required before the entry is worth anything.
   */
  bio?: string;
  /**
   * Search terms for this channel, shown on the page as tags and carried in
   * its structured data. Visible on purpose: a keyword list hidden from
   * readers and shown only to crawlers is what Google calls hidden text, and
   * it is penalised. `<meta name="keywords">` would be the other option and
   * has been ignored by every major engine since 2009.
   */
  keywords?: string[];
  type: 'tv' | 'radio' | 'website';
  category: 'وطنية' | 'خاصة' | 'محلية' | 'دينية' | 'متخصصة' | 'إخبارية' | 'رياضية' | 'ثقافية' | 'قنوات الكترونية' | 'نوادي إعلامية';
  frequency?: string;
  email?: string;
  address?: string;
  website?: string;
  phone?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
  twitter?: string;
  createdAt: number;
}

export type IndividualType =
  | 'editor_news' | 'web_digital' | 'presenter_programs' | 'presenter_news'
  | 'monteur' | 'graphic_designer' | 'cameraman' | 'producer' | 'director'
  | 'program_writer' | 'voice' | 'host_stage' | 'student' | 'other'
  | 'journalist' | 'photographer' | 'editor';
export type AccountType = IndividualType | 'store' | 'trainer';

/**
 * The Arabic name for every account type, in one place.
 *
 * This existed as four separate copies — three identical and one, in the
 * admin dashboard, covering three types out of nineteen and calling a
 * معلق صوتي a منشط صوتي. So the admin saw the wrong job title for voice
 * artists and a raw "trainer" or "student" for everyone the stub missed,
 * while the public pages showed the right thing all along.
 */
export const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  editor_news: "محرر أخبار",
  web_digital: "ويب ديجيتال",
  presenter_programs: "مقدم برامج",
  presenter_news: "مقدم أخبار",
  monteur: "مونتير",
  graphic_designer: "جرافيك ديزاينر",
  cameraman: "كاميرا مان",
  producer: "منتج",
  director: "مخرج",
  program_writer: "معد برامج",
  voice: "معلق صوتي",
  host_stage: "منشط على الركح",
  student: "طالب إعلام",
  journalist: "صحفي / مراسل",
  photographer: "مصور",
  editor: "مخرج / مونتير",
  store: "متجر عتاد",
  trainer: "مدرب",
  other: "إعلامي",
};

/**
 * What a member may add as a second trade.
 *
 * Not every account type belongs here: a متجر or a مدرب is a different kind
 * of account, not a second job, and "إعلامي" says nothing as an addition.
 */
export const SECONDARY_TYPE_OPTIONS = [
  "journalist", "photographer", "editor_news", "web_digital",
  "presenter_programs", "presenter_news", "monteur", "graphic_designer",
  "cameraman", "producer", "director", "program_writer", "voice", "host_stage",
] as const;

/** Three is a trade beside a trade; ten is a list of everything. */
export const MAX_SECONDARY_TYPES = 3;

/** The main trade first, then the added ones, with no repeats. */
export function professionsOf(
  profile: { type?: string; secondaryTypes?: string[] } | null | undefined
): string[] {
  if (!profile) return [];
  return [...new Set([profile.type, ...(profile.secondaryTypes ?? [])])].filter(
    (t): t is string => Boolean(t)
  );
}

/** Falls back to the stored value, so a new type shows as itself, not blank. */
export function accountTypeLabel(type: string | undefined): string {
  return ACCOUNT_TYPE_LABEL[type ?? ""] ?? type ?? "";
}

export interface TrainerCourse {
  id: string;
  trainerId: string;
  title: string;
  description: string;
  image?: string;
  contentImages?: string[];
  type: "free" | "paid";
  price?: number;
  duration: string;
  location: string;
  schedule: string;
  startDate?: string;
  seats?: number;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  createdAt: number;
  rejectionNote?: string;
}

export interface CourseRegistration {
  id: string;
  courseId: string;
  courseTitle: string;
  trainerId: string;
  name: string;
  phone: string;
  email?: string;
  wilaya?: string;
  note?: string;
  createdAt: number;
}

export const INTERESTS = ['الاقتصاد', 'الفن', 'الرياضة', 'السياسة'] as const;
export type Interest = typeof INTERESTS[number];

export interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
  youtube?: string;
  twitter?: string;
}

export interface PortfolioLink {
  label: string;
  url: string;
}

export interface PortfolioVideo {
  title: string;
  url: string;
}

export const WORK_TYPES = ['article', 'video', 'audio', 'image'] as const;
export type WorkType = typeof WORK_TYPES[number];

/**
 * A published work in the public gallery.
 *
 * Distinct from PortfolioWork, which is an entry embedded in a profile: a
 * gallery work is its own document because it carries counters that anyone
 * can move (views), a list only its likers may change (likedBy), and a flag
 * only the admin sets (featured) — none of which can be guarded by security
 * rules while they sit inside an array on someone's profile.
 *
 * The owner's name, type and photo are copied onto the work so a gallery of
 * sixty can render without sixty profile reads.
 */
export interface Work {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerType?: AccountType;
  ownerPhoto?: string;
  title: string;
  description?: string;
  type: WorkType;
  /** article: external link · video: YouTube · audio/image: uploaded file */
  url: string;
  /** Shown in the gallery grid; falls back to the work itself for an image. */
  cover?: string;
  views: number;
  likes: number;
  /** One entry per person who liked it, so a like cannot be repeated. */
  likedBy: string[];
  /** Set by the admin only; promotes the work to the home page. */
  featured: boolean;
  createdAt: number;
}

export interface PortfolioWork {
  id: string;
  type: WorkType;
  title: string;
  url: string; // article: external link | video: youtube link | audio/image: uploaded file URL
}

export const VOICE_SAMPLE_CATEGORIES = ['وثائقي', 'دوبلاج', 'إعلاني', 'تعليمي', 'قصصي', 'إخباري', 'بودكاست', 'كتب صوتية', 'رد آلي', 'أخرى'] as const;
export type VoiceSampleCategory = typeof VOICE_SAMPLE_CATEGORIES[number];

export interface AudioSample {
  url: string;
  title: string;
  category: VoiceSampleCategory;
}

export type Gender = 'male' | 'female';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  type: AccountType;
  /**
   * Trades the member also practises. One person is often two things — a
   * مونتير who is also a معلق صوتي — and a single `type` made them pick one
   * and disappear from the other's listing.
   *
   * The main trade stays in `type`, which only the admin may change; these
   * are the member's own to declare.
   */
  secondaryTypes?: string[];
  otherType?: string;
  bio: string;
  photo?: string;
  portfolio?: PortfolioLink[];
  portfolioVideos?: PortfolioVideo[];
  achievements?: string;
  specialty?: string;
  location?: string;
  phone?: string;
  experience?: string;
  storeStatus?: 'trial' | 'paid';
  organization?: string;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  rejectionNote?: string;
  /**
   * A remark the admin leaves for the member — a missing photo, a phone
   * number that does not work. Unlike `rejectionNote` it does not reject the
   * profile, so it can be used on an approved one without taking it offline.
   */
  adminNote?: string;
  adminNoteAt?: number;
  createdAt: number;
  username?: string;
  /** Store / trainer contact number used for the WhatsApp deep link. */
  whatsapp?: string;
  interests?: string[];
  tagline?: string;
  gender?: Gender;
  audioSamples?: AudioSample[];
  socialLinks?: SocialLinks;
  works?: PortfolioWork[];
  languages?: string[];
  voiceStyles?: string[];
  services?: string[];
  availability?: "available" | "busy";
}

export const PRODUCT_CATEGORIES = ["كاميرات", "ميكروفونات", "إضاءة", "حوامل وأرجل", "بطاريات وشواحن", "أجهزة حاسوبية", "سماعات", "لوازم تصوير", "أخرى"] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export type ProductStatus = 'active' | 'archived';
export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  contentImages?: string[];
  quantity: number;
  createdAt: number;
  status: ProductStatus;
}

export type OrderStatus = 'pending' | 'in_delivery' | 'sold' | 'cancelled';
export interface Order {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  buyerFirstName: string;
  buyerLastName: string;
  /** Required: the seller has no other way to reach the buyer about delivery. */
  buyerPhone: string;
  wilaya: string;
  city: string;
  quantity: number;
  note?: string;
  status: OrderStatus;
  createdAt: number;
  sellerNote?: string;
}
