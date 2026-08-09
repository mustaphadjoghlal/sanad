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
  portfolioLinks?: string[];
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

export interface PortfolioWork {
  id: string;
  type: WorkType;
  title: string;
  url: string; // article: external link | video: youtube link | audio/image: uploaded file URL
}

export const VOICE_SAMPLE_CATEGORIES = ['وثائقي', 'دوبلاج', 'إعلاني', 'تعليمي', 'قصصي', 'إخباري', 'بودكاست', 'أخرى'] as const;
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
  createdAt: number;
  username?: string;
  interests?: string[];
  tagline?: string;
  gender?: Gender;
  audioSamples?: AudioSample[];
  socialLinks?: SocialLinks;
  works?: PortfolioWork[];
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
  wilaya: string;
  city: string;
  quantity: number;
  note?: string;
  status: OrderStatus;
  createdAt: number;
  sellerNote?: string;
}
