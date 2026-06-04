-- White-label agency / multi-tenant system

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  custom_domain text unique,
  logo_url text,
  primary_color text not null default '#B4FF00',
  secondary_color text not null default '#060608',
  plan text not null default 'starter'
    check (plan in ('starter', 'pro', 'enterprise')),
  stripe_subscription_id text,
  stripe_customer_id text,
  max_seats integer not null default 10,
  credits_pool integer not null default 0,
  is_active boolean not null default true,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_tenants_slug on public.tenants (slug);
create index if not exists idx_tenants_custom_domain
  on public.tenants (custom_domain)
  where custom_domain is not null;

alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants (id) on delete set null,
  add column if not exists tenant_role text
    check (tenant_role is null or tenant_role in ('owner', 'admin', 'member'));

create index if not exists idx_profiles_tenant on public.profiles (tenant_id);

create table if not exists public.tenant_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email text not null,
  role text not null default 'member'
    check (role in ('admin', 'member')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists idx_tenant_invites_token on public.tenant_invites (token);
create index if not exists idx_tenant_invites_tenant on public.tenant_invites (tenant_id);

alter table public.tenants enable row level security;
alter table public.tenant_invites enable row level security;

-- Tenant members can read their tenant
create policy "tenants_select_member"
  on public.tenants for select
  using (
    id in (
      select tenant_id from public.profiles
      where id = auth.uid() and tenant_id is not null
    )
    or owner_id = auth.uid()
  );

create policy "tenants_select_public_slug"
  on public.tenants for select
  using (is_active = true);

create policy "tenants_update_owner"
  on public.tenants for update
  using (owner_id = auth.uid());

create policy "tenant_invites_select_member"
  on public.tenant_invites for select
  using (
    tenant_id in (
      select tenant_id from public.profiles
      where id = auth.uid()
        and tenant_role in ('owner', 'admin')
    )
  );

-- Logo uploads: bucket influexai-tenant-logos (create in dashboard via service role)
insert into storage.buckets (id, name, public)
values ('tenant-logos', 'tenant-logos', true)
on conflict (id) do nothing;

create policy "tenant_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'tenant-logos');

create policy "tenant_logos_owner_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'tenant-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "tenant_logos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'tenant-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
