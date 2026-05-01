export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SkillAxes = 
  | 'algorithms'
  | 'data_structures'
  | 'complexity'
  | 'coding'
  | 'debugging'
  | 'speed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          skills: Record<SkillAxes, number>
          created_at: string
        }
        Insert: {
          id: string
          username: string
          skills?: Record<SkillAxes, number>
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          skills?: Record<SkillAxes, number>
          created_at?: string
        }
      }
      problems: {
        Row: {
          id: string
          title: string
          description: string
          difficulty: string
          requirements: Record<SkillAxes, { level: number; weight: number }>
          sample_input: string | null
          sample_output: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          difficulty?: string
          requirements?: Record<SkillAxes, { level: number; weight: number }>
          sample_input?: string | null
          sample_output?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          difficulty?: string
          requirements?: Record<SkillAxes, { level: number; weight: number }>
          sample_input?: string | null
          sample_output?: string | null
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          user_id: string
          problem_id: string
          cf_submission_id?: string | null
          status: string
          verdict?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          problem_id: string
          cf_submission_id?: string | null
          status: string
          verdict?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          problem_id?: string
          cf_submission_id?: string | null
          status?: string
          verdict?: string
          created_at?: string
        }
      }
      roadmap_topics: {
        Row: {
          id: string
          title: string
          stage: string
          order_index: number
          prerequisites: string[] | null
          article_markdown: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          stage: string
          order_index?: number
          prerequisites?: string[] | null
          article_markdown?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          stage?: string
          order_index?: number
          prerequisites?: string[] | null
          article_markdown?: string | null
          created_at?: string
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
