-- Migration 032: generations.result (jsonb) for viral_score history
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/hszjafdelcydnppyolkm/sql/new

alter table public.generations
  add column if not exists result jsonb;

create index if not exists idx_generations_user_type_result
  on public.generations (user_id, type)
  where result is not null;
