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
      userdata: {
        Row: {
          id: string
          created_at: string
          user_id: string
          business_type: string
          questionnaire_data: Json | null
          todo_list: Json | null
          business_plan: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          business_type: string
          questionnaire_data?: Json | null
          todo_list?: Json | null
          business_plan?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          business_type?: string
          questionnaire_data?: Json | null
          todo_list?: Json | null
          business_plan?: Json | null
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