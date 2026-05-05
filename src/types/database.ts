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
  | 'logic'
  | 'math'
  | 'graphs'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          skills: Json
          primary_subject: string | null
          experience_level: string | null
          code_template: string | null
          settings: Json
          created_at: string
        }
        Insert: {
          id: string
          username: string
          skills?: Json
          primary_subject?: string | null
          experience_level?: string | null
          code_template?: string | null
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          skills?: Json
          primary_subject?: string | null
          experience_level?: string | null
          code_template?: string | null
          settings?: Json
          created_at?: string
        }
      }
      problems: {
        Row: {
          id: string
          title: string
          description: string
          note: string | null
          difficulty: string
          rating: number | null
          requirements: Record<SkillAxes, { level: number; weight: number }>
          sample_input: string | null
          sample_output: string | null
          external_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          note?: string | null
          difficulty?: string
          rating?: number | null
          requirements?: Record<SkillAxes, { level: number; weight: number }>
          sample_input?: string | null
          sample_output?: string | null
          external_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          note?: string | null
          difficulty?: string
          rating?: number | null
          requirements?: Record<SkillAxes, { level: number; weight: number }>
          sample_input?: string | null
          sample_output?: string | null
          external_id?: string | null
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          user_id: string
          problem_id: string
          cf_submission_id: string | number | null
          status: string
          verdict: string | null
          code: string | null
          language: string | null
          test_case: number | null
          time_ms: number | null
          memory_kb: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          problem_id: string
          cf_submission_id?: string | number | null
          status: string
          verdict?: string | null
          code?: string | null
          language?: string | null
          test_case?: number | null
          time_ms?: number | null
          memory_kb?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          problem_id?: string
          cf_submission_id?: string | number | null
          status?: string
          verdict?: string | null
          code?: string | null
          language?: string | null
          test_case?: number | null
          time_ms?: number | null
          memory_kb?: number | null
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
          article_url: string | null
          level: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          stage: string
          order_index?: number
          prerequisites?: string[] | null
          article_markdown?: string | null
          article_url?: string | null
          level?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          stage?: string
          order_index?: number
          prerequisites?: string[] | null
          article_markdown?: string | null
          article_url?: string | null
          level?: string
          created_at?: string
        }
      }
      topic_problems: {
        Row: {
          id: string
          topic_id: string
          problem_id: string | null
          source: string
          source_id: string
          title: string
          url: string
          cf_rating: number | null
          difficulty: string
          layer: string
          tags: string[]
          solved_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          problem_id?: string | null
          source: string
          source_id: string
          title: string
          url: string
          cf_rating?: number | null
          difficulty?: string
          layer?: string
          tags?: string[]
          solved_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          problem_id?: string | null
          source?: string
          source_id?: string
          title?: string
          url?: string
          cf_rating?: number | null
          difficulty?: string
          layer?: string
          tags?: string[]
          solved_count?: number | null
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
