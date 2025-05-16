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
          phone?: string | null
          service_type: string
          reason: string
          is_urgent: boolean
          submitted_at: string
          status: string
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
          status?: string
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
          status?: string
        }
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          phone?: string | null
          message: string
          submitted_at: string
          status: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          message: string
          submitted_at?: string
          status?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          message?: string
          submitted_at?: string
          status?: string
        }
      }
      testimonials: {
        Row: {
          id: string
          name: string
          quote: string
          location?: string | null
          submitted_at: string
          status: string
        }
        Insert: {
          id?: string
          name: string
          quote: string
          location?: string | null
          submitted_at?: string
          status?: string
        }
        Update: {
          id?: string
          name?: string
          quote?: string
          location?: string | null
          submitted_at?: string
          status?: string
        }
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
  }
}