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
}

export interface VoiceArtist {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  description: string;
  contact: string;
  createdAt: number;
}
