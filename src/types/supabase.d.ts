// types/supabase.d.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          service_type: string;
          reason: string;
          is_urgent: boolean;
          submitted_at: string;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          service_type: string;
          reason: string;
          is_urgent: boolean;
          submitted_at?: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
        };
        Update: Partial<Appointment['Row']>;
      };

      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          message: string;
          submitted_at: string;
          status: 'unread' | 'read' | 'archived';
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          message: string;
          submitted_at?: string;
          status?: 'unread' | 'read' | 'archived';
        };
        Update: Partial<ContactMessage['Row']>;
      };

      testimonials: {
        Row: {
          id: string;
          name: string;
          quote: string;
          location: string | null;
          submitted_at: string;
          status: 'pending_approval' | 'approved' | 'rejected';
        };
        Insert: {
          id?: string;
          name: string;
          quote: string;
          location?: string | null;
          submitted_at?: string;
          status?: 'pending_approval' | 'approved' | 'rejected';
        };
        Update: Partial<Testimonial['Row']>;
      };

      admin_users: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AdminUser['Row']>;
      };
    };
  };
}

// Pour Supabase Client
export type SupabaseDatabase = Database;
