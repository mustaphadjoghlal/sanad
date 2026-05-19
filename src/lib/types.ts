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
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  siteName: "سند",
  heroBadge: "المنصة الجزائرية الإعلامية الشاملة",
  heroTitle: "منصة",
  heroSubtitle: "لكل إعلامي جزائري",
  heroDescription: "دورات تدريبية، فرص عمل، معدات، مسابقات، ومنشطون — كل ما تحتاجه في مكان واحد",
  heroCta1: "ابدأ الاستكشاف",
  heroCta2: "انضم إلى سند",
  servicesLabel: "ما الذي تجده في سند؟",
  servicesTitle: "خدمات المنصة",
  ctaTitle: "انضم إلى مجتمع سند",
  ctaSubtitle: "سجّل حسابك المجاني الآن وكن جزءاً من أول منصة إعلامية جزائرية شاملة",
  ctaButton: "إنشاء حساب مجاني",
  ctaButton2: "تصفح الدورات",
};

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  link?: string;
  createdAt: number;
  readBy?: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'tv' | 'radio';
  category: 'وطنية' | 'خاصة' | 'محلية' | 'دينية' | 'متخصصة';
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

export type IndividualType = 'journalist' | 'voice' | 'photographer' | 'editor' | 'student' | 'other';
export type AccountType = IndividualType | 'store';

export interface PortfolioLink {
  label: string;
  url: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  type: AccountType;
  otherType?: string;
  bio: string;
  photo?: string;
  portfolio?: PortfolioLink[];
  achievements?: string;
  specialty?: string;
  location?: string;
  phone?: string;
  experience?: string;
  storeStatus?: 'trial' | 'paid';
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  rejectionNote?: string;
  createdAt: number;
}
