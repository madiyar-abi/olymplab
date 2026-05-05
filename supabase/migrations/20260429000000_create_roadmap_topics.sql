-- Create roadmap_topics table for the Structured Syllabi feature
create table if not exists public.roadmap_topics (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  stage text not null,
  order_index integer not null,
  prerequisites text[] default '{}',
  article_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.roadmap_topics enable row level security;

-- Allow all authenticated users to read
drop policy if exists "Allow authenticated read" on public.roadmap_topics;
create policy "Allow authenticated read"
  on public.roadmap_topics
  for select
  to authenticated
  using (true);

-- Add article_markdown column
alter table public.roadmap_topics add column if not exists article_markdown text;
