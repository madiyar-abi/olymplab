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
          preferred_language: string | null
          hide_unsolved_tags: boolean | null
          cf_handle: string | null
          settings: Json
          solved_count: number
          level: number
          created_at: string
        }
        Insert: {
          id: string
          username: string
          skills?: Json
          primary_subject?: string | null
          experience_level?: string | null
          code_template?: string | null
          preferred_language?: string | null
          hide_unsolved_tags?: boolean | null
          cf_handle?: string | null
          settings?: Json
          solved_count?: number
          level?: number
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          skills?: Json
          primary_subject?: string | null
          experience_level?: string | null
          code_template?: string | null
          preferred_language?: string | null
          hide_unsolved_tags?: boolean | null
          cf_handle?: string | null
          settings?: Json
          solved_count?: number
          level?: number
          created_at?: string
        }
        Relationships: []
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
          tags: string[]
          sample_input: string | null
          sample_output: string | null
          external_id: string | null
          time_limit: string | null
          memory_limit: string | null
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
          tags?: string[]
          sample_input?: string | null
          sample_output?: string | null
          external_id?: string | null
          time_limit?: string | null
          memory_limit?: string | null
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
          tags?: string[]
          sample_input?: string | null
          sample_output?: string | null
          external_id?: string | null
          time_limit?: string | null
          memory_limit?: string | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      revealed_problems: {
        Row: {
          user_id: string
          problem_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          problem_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          problem_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          user_id: string
          problem_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          problem_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          problem_id?: string
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_verdict_stats: {
        Args: {
          p_user_id: string
        }
        Returns: {
          verdict: string
          count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
