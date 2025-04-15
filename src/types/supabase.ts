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
      projects: {
        Row: {
          id: string
          created_at: string
          user_id: string
          business_idea: string | null
          brief_summary: string | null
          total_budget: number | null
          expected_launch_date: string | null
          income_goal: number | null
          todo_1: string | null
          todo_2: string | null
          todo_3: string | null
          todo_4: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          business_idea?: string | null
          brief_summary?: string | null
          total_budget?: number | null
          expected_launch_date?: string | null
          income_goal?: number | null
          todo_1?: string | null
          todo_2?: string | null
          todo_3?: string | null
          todo_4?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          business_idea?: string | null
          brief_summary?: string | null
          total_budget?: number | null
          expected_launch_date?: string | null
          income_goal?: number | null
          todo_1?: string | null
          todo_2?: string | null
          todo_3?: string | null
          todo_4?: string | null
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