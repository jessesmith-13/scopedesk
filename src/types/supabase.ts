// Generated Supabase types - will be auto-generated once Supabase is connected
// For now, defining manually based on schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WebsiteStatus = 'no_website' | 'has_website' | 'unknown';
export type LeadOutreachStatus = 'not_contacted' | 'contacted' | 'follow_up' | 'interested' | 'rejected';
export type DealStage = 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';
export type ActivityType = 'email' | 'call' | 'meeting' | 'note' | 'walk_in' | 'sms';
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'expired';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type TaskPriority = 'low' | 'medium' | 'high';
export type SendProvider = 'resend' | 'gmail' | 'manual';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          category: string | null;
          sub_category: string | null;
          neighborhood: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string;
          lat: number | null;
          lng: number | null;
          phone: string | null;
          website_url: string | null;
          website_status: WebsiteStatus;
          outreach_status: LeadOutreachStatus;
          score: number;
          score_reason: Json | null;
          source: string | null;
          source_place_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          category?: string | null;
          sub_category?: string | null;
          neighborhood?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          website_url?: string | null;
          website_status?: WebsiteStatus;
          outreach_status?: LeadOutreachStatus;
          score?: number;
          score_reason?: Json | null;
          source?: string | null;
          source_place_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          category?: string | null;
          sub_category?: string | null;
          neighborhood?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          website_url?: string | null;
          website_status?: WebsiteStatus;
          outreach_status?: LeadOutreachStatus;
          score?: number;
          score_reason?: Json | null;
          source?: string | null;
          source_place_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string;
          full_name: string;
          role: string | null;
          email: string | null;
          phone: string | null;
          preferred_method: string | null;
          is_primary: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lead_id: string;
          full_name: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          preferred_method?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string;
          full_name?: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          preferred_method?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string;
          primary_contact_id: string | null;
          stage: DealStage;
          deal_value: number | null;
          probability: number;
          expected_close_date: string | null;
          service_type: string | null;
          title: string | null;
          next_follow_up_at: string | null;
          lost_reason: string | null;
          won_at: string | null;
          lost_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lead_id: string;
          primary_contact_id?: string | null;
          stage?: DealStage;
          deal_value?: number | null;
          probability?: number;
          expected_close_date?: string | null;
          service_type?: string | null;
          title?: string | null;
          next_follow_up_at?: string | null;
          lost_reason?: string | null;
          won_at?: string | null;
          lost_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string;
          primary_contact_id?: string | null;
          stage?: DealStage;
          deal_value?: number | null;
          probability?: number;
          expected_close_date?: string | null;
          service_type?: string | null;
          title?: string | null;
          next_follow_up_at?: string | null;
          lost_reason?: string | null;
          won_at?: string | null;
          lost_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string | null;
          deal_id: string | null;
          contact_id: string | null;
          type: ActivityType;
          subject: string | null;
          body: string | null;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lead_id?: string | null;
          deal_id?: string | null;
          contact_id?: string | null;
          type: ActivityType;
          subject?: string | null;
          body?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string | null;
          deal_id?: string | null;
          contact_id?: string | null;
          type?: ActivityType;
          subject?: string | null;
          body?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          name: string;
          subject: string | null;
          body: string;
          variables: Json | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          name: string;
          subject?: string | null;
          body: string;
          variables?: Json | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          name?: string;
          subject?: string | null;
          body?: string;
          variables?: Json | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      proposals: {
        Row: {
          id: string;
          user_id: string;
          deal_id: string;
          status: ProposalStatus;
          title: string;
          currency: string;
          subtotal: number;
          tax: number;
          total: number;
          content: Json | null;
          pdf_url: string | null;
          sent_to: string | null;
          sent_at: string | null;
          viewed_at: string | null;
          signed_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          deal_id: string;
          status?: ProposalStatus;
          title: string;
          currency?: string;
          subtotal: number;
          tax?: number;
          total: number;
          content?: Json | null;
          pdf_url?: string | null;
          sent_to?: string | null;
          sent_at?: string | null;
          viewed_at?: string | null;
          signed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          deal_id?: string;
          status?: ProposalStatus;
          title?: string;
          currency?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          content?: Json | null;
          pdf_url?: string | null;
          sent_to?: string | null;
          sent_at?: string | null;
          viewed_at?: string | null;
          signed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          deal_id: string;
          proposal_id: string | null;
          status: InvoiceStatus;
          currency: string;
          amount: number;
          due_date: string | null;
          paid_at: string | null;
          stripe_customer_id: string | null;
          stripe_invoice_id: string | null;
          stripe_payment_intent_id: string | null;
          pdf_url: string | null;
          sent_to: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          deal_id: string;
          proposal_id?: string | null;
          status?: InvoiceStatus;
          currency?: string;
          amount: number;
          due_date?: string | null;
          paid_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_invoice_id?: string | null;
          stripe_payment_intent_id?: string | null;
          pdf_url?: string | null;
          sent_to?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          deal_id?: string;
          proposal_id?: string | null;
          status?: InvoiceStatus;
          currency?: string;
          amount?: number;
          due_date?: string | null;
          paid_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_invoice_id?: string | null;
          stripe_payment_intent_id?: string | null;
          pdf_url?: string | null;
          sent_to?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string | null;
          deal_id: string | null;
          title: string;
          notes: string | null;
          due_at: string | null;
          priority: TaskPriority;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lead_id?: string | null;
          deal_id?: string | null;
          title: string;
          notes?: string | null;
          due_at?: string | null;
          priority?: TaskPriority;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string | null;
          deal_id?: string | null;
          title?: string;
          notes?: string | null;
          due_at?: string | null;
          priority?: TaskPriority;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      website_status: WebsiteStatus;
      lead_outreach_status: LeadOutreachStatus;
      deal_stage: DealStage;
      activity_type: ActivityType;
      proposal_status: ProposalStatus;
      invoice_status: InvoiceStatus;
      task_priority: TaskPriority;
      send_provider: SendProvider;
    };
  };
}
