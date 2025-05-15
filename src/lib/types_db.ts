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
          created_at: string
          name: string
          email: string
          phone: string
          service: string
          preferred_date: string
          preferred_time: string
          message: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          service: string
          preferred_date: string
          preferred_time: string
          message?: string | null
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          service?: string
          preferred_date?: string
          preferred_time?: string
          message?: string | null
          status?: string
        }
      }
      contact_messages: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          message: string
          read: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          message: string
          read?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          message?: string
          read?: boolean
        }
      }
      testimonials: {
        Row: {
          id: string
          created_at: string
          name: string
          rating: number
          comment: string
          approved: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          rating: number
          comment: string
          approved?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          rating?: number
          comment?: string
          approved?: boolean
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