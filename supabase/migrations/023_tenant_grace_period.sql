-- Grace period after agency subscription ends (7 days)

alter table public.tenants
  add column if not exists deactivated_at timestamptz;

drop policy if exists "tenants_select_public_slug" on public.tenants;

create policy "tenants_select_public_slug"
  on public.tenants for select
  using (
    is_active = true
    or (
      deactivated_at is not null
      and deactivated_at > (now() - interval '7 days')
    )
  );
