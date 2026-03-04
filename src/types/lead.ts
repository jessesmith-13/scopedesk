// Domain types for Lead entity (UI-facing, camelCase)
// Maps from Database types defined in supabase.ts

export type WebsiteStatus = 'no_website' | 'has_website' | 'unknown';
export type LeadOutreachStatus = 'not_contacted' | 'contacted' | 'follow_up' | 'interested' | 'rejected';

// Type for score reason JSON structure
export interface ScoreReason {
  [key: string]: string | number | boolean;
}

export interface Lead {
  id: string;
  userId: string;
  businessName: string;
  category: string | null;
  subCategory: string | null;
  neighborhood: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  websiteUrl: string | null;
  websiteStatus: WebsiteStatus;
  outreachStatus: LeadOutreachStatus;
  score: number;
  scoreReason: ScoreReason | null;
  source: string | null;
  sourcePlaceId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// For creating new leads
export interface CreateLeadInput {
  businessName: string;
  category?: string | null;
  subCategory?: string | null;
  neighborhood?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  websiteUrl?: string | null;
  websiteStatus?: WebsiteStatus;
  outreachStatus?: LeadOutreachStatus;
  score?: number;
  scoreReason?: ScoreReason | null;
  source?: string | null;
  sourcePlaceId?: string | null;
  notes?: string | null;
}

// For updating existing leads
export interface UpdateLeadInput {
  businessName?: string;
  category?: string | null;
  subCategory?: string | null;
  neighborhood?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  websiteUrl?: string | null;
  websiteStatus?: WebsiteStatus;
  outreachStatus?: LeadOutreachStatus;
  score?: number;
  scoreReason?: ScoreReason | null;
  source?: string | null;
  sourcePlaceId?: string | null;
  notes?: string | null;
}

// Helper function to calculate score
export function calculateScore(lead: Partial<Lead>): number {
  let score = 0;
  
  if (lead.websiteStatus === 'no_website') score += 30;
  if (lead.outreachStatus === 'rejected') score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

// Helper function to get status label
export function getStatusLabel(status: LeadOutreachStatus): string {
  const labels: Record<LeadOutreachStatus, string> = {
    not_contacted: 'Not Contacted',
    contacted: 'Contacted',
    follow_up: 'Follow Up',
    interested: 'Interested',
    rejected: 'Rejected'
  };
  return labels[status];
}

// Helper function to get status color
export function getStatusColor(status: LeadOutreachStatus): string {
  const colors: Record<LeadOutreachStatus, string> = {
    not_contacted: 'bg-gray-100 text-gray-800',
    contacted: 'bg-blue-100 text-blue-800',
    follow_up: 'bg-yellow-100 text-yellow-800',
    interested: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return colors[status];
}

// Helper function to get website status badge
export function getWebsiteStatusBadge(status: WebsiteStatus): { label: string; color: string } {
  const badges: Record<WebsiteStatus, { label: string; color: string }> = {
    no_website: { label: 'No Website', color: 'bg-red-100 text-red-800' },
    has_website: { label: 'Has Website', color: 'bg-green-100 text-green-800' },
    unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
  };
  return badges[status];
}