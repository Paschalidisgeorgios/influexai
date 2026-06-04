-- Paid-only: new users start with 0 credits (no free tier / signup bonus).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits, created_at)
  values (
    new.id,
    new.email,
    0,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
