-- AI Creator consent audit trail (consent_confirmed boolean from 063)

alter table public.characters add column if not exists consent_confirmed_at timestamptz;
alter table public.characters add column if not exists consent_source text;
alter table public.characters add column if not exists consent_version text;

comment on column public.characters.consent_confirmed_at is
  'When the user confirmed rights/consent for this character draft.';
comment on column public.characters.consent_source is
  'Origin of consent capture, e.g. ai_creator_draft.';
comment on column public.characters.consent_version is
  'Consent copy/version identifier at time of confirmation.';
