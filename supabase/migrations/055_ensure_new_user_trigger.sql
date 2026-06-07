-- Ensure auth.users → profiles row on signup (trigger was missing from repo).
-- Start credits: 0 (paid-only, see 024_paid_only_new_users.sql).

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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill: auth users without a profile row (idempotent)
insert into public.profiles (id, email, credits, created_at)
select u.id, u.email, 0, now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
