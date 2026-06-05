-- Protect profiles.role from client self-elevation.

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin', 'owner'));

update public.profiles
set role = 'admin'
where is_admin = true
  and role = 'user';

revoke update (role) on table public.profiles from anon;
revoke update (role) on table public.profiles from authenticated;

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::json->>'role',
    ''
  );

  if jwt_role = 'service_role' then
    return new;
  end if;

  raise exception 'profiles.role cannot be changed'
    using errcode = '42501';
end;
$$;

drop trigger if exists protect_profiles_role on public.profiles;

create trigger protect_profiles_role
  before update of role on public.profiles
  for each row
  execute function public.prevent_role_change();
