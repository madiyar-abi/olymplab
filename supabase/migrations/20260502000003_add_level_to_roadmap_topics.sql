-- Add level field to roadmap_topics for curriculum progression tracking
-- Levels: beginner (1–14), junior_cp (15–22), middle_cp (23–32), advanced_cp (33–43)
alter table public.roadmap_topics
  add column if not exists level text not null default 'beginner';
