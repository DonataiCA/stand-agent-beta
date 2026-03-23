export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  companyType: 'STARTUP' | 'CORPORATION' | 'AGENCY' | 'FREELANCER' | 'INVESTOR' | 'OTHER' | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  businessAngle: string | null;
  notes: string | null;
  source: 'TEXT' | 'AUDIO' | 'PHOTO' | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface RagResponse {
  answer: string;
  sources: Lead[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
