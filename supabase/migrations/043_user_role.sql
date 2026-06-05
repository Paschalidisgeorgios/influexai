-- Platform role on profiles (plan-gate bypass for admin/owner).
-- Note: migration 029 is faceswap_uploads_bucket; this is the role migration.

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin', 'owner'));

create index if not exists idx_profiles_role on public.profiles (role)
  where role <> 'user';

-- Legacy is_admin → role admin
update public.profiles
set role = 'admin'
where is_admin = true
  and role = 'user';

-- Clients must not self-elevate role or is_admin (service_role bypasses via RLS).
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role is not distinct from (
      select p.role from public.profiles p where p.id = auth.uid()
    )
    and is_admin is not distinct from (
      select p.is_admin from public.profiles p where p.id = auth.uid()
    )
  );
