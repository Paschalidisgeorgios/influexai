-- platform_settings: add id column (PostgREST / select id); key stays primary key

alter table public.platform_settings
  add column if not exists id uuid default gen_random_uuid();

update public.platform_settings
set id = gen_random_uuid()
where id is null;

alter table public.platform_settings
  alter column id set not null;

create unique index if not exists platform_settings_id_idx
  on public.platform_settings (id);
