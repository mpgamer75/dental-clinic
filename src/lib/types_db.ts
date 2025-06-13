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
      admin_users: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          clinic_name_es: string
          clinic_name_en: string
          doctor_name_es: string
          doctor_name_en: string
          address_es: string
          address_en: string
          phone_es: string
          phone_en: string
          email: string
          schedule_es: string
          schedule_en: string
          map_link_es: string
          map_link_en: string
          embed_map_link_es: string
          embed_map_link_en: string
          maintenance_mode: boolean
          allow_appointments: boolean
          allow_testimonials: boolean
          allow_contact_form: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_name_es?: string
          clinic_name_en?: string
          doctor_name_es?: string
          doctor_name_en?: string
          address_es?: string
          address_en?: string
          phone_es?: string
          phone_en?: string
          email?: string
          schedule_es?: string
          schedule_en?: string
          map_link_es?: string
          map_link_en?: string
          embed_map_link_es?: string
          embed_map_link_en?: string
          maintenance_mode?: boolean
          allow_appointments?: boolean
          allow_testimonials?: boolean
          allow_contact_form?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_name_es?: string
          clinic_name_en?: string
          doctor_name_es?: string
          doctor_name_en?: string
          address_es?: string
          address_en?: string
          phone_es?: string
          phone_en?: string
          email?: string
          schedule_es?: string
          schedule_en?: string
          map_link_es?: string
          map_link_en?: string
          embed_map_link_es?: string
          embed_map_link_en?: string
          maintenance_mode?: boolean
          allow_appointments?: boolean
          allow_testimonials?: boolean
          allow_contact_form?: boolean
          created_at?: string
          updated_at?: string
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