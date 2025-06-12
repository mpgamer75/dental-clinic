export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          service_type: string
          reason: string
          is_urgent: boolean
          submitted_at: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          service_type: string
          reason: string
          is_urgent?: boolean
          submitted_at?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          service_type?: string
          reason?: string
          is_urgent?: boolean
          submitted_at?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          message: string
          submitted_at: string
          status: 'unread' | 'read' | 'archived'
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          message: string
          submitted_at?: string
          status?: 'unread' | 'read' | 'archived'
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          message?: string
          submitted_at?: string
          status?: 'unread' | 'read' | 'archived'
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          id: string
          name: string
          quote: string
          location: string | null
          submitted_at: string
          status: 'pending_approval' | 'approved' | 'rejected'
        }
        Insert: {
          id?: string
          name: string
          quote: string
          location?: string | null
          submitted_at?: string
          status?: 'pending_approval' | 'approved' | 'rejected'
        }
        Update: {
          id?: string
          name?: string
          quote?: string
          location?: string | null
          submitted_at?: string
          status?: 'pending_approval' | 'approved' | 'rejected'
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}