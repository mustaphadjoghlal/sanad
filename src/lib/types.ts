export interface Course {
  id: string;
  title: string;
  type: "free" | "paid";
  price?: number;
  duration: string;
  description: string;
  instructor: string;
  link?: string;
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
  organizer: string;
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
  bgMain: string;
  bgCard: string;
  primaryGreen: string;
  accentGreen: string;
  textColor: string;
}

export const DEFAULT_THEME: ThemeSettings = {
  bgMain: "#0e0e0e",
  bgCard: "#141414",
  primaryGreen: "#006233",
  accentGreen: "#00a355",
  textColor: "#e8f5e9",
};

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  type: 'journalist' | 'voice' | 'vendor';
  bio: string;
  specialty?: string;
  location?: string;
  phone?: string;
  experience?: string;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  rejectionNote?: string;
  createdAt: number;
}
