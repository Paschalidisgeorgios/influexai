-- Store structured AI results on generations (e.g. viral_score JSON)

alter table public.generations
  add column if not exists result jsonb;

create index if not exists idx_generations_user_type_result
  on public.generations (user_id, type)
  where result is not null;
