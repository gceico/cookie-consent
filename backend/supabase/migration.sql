-- @gceico/cookie-consent — reference Supabase migration for `supabaseAdapter`.
--
-- Generalized copy of app/supabase/migrations/20260422120000_add-consent-logs.sql.
-- The table name here (`consent_logs`) MUST match whatever `table` option you
-- pass to `supabaseAdapter({ url, anonKey, table })` — the adapter's default
-- is also `consent_logs`, so leave both alone unless you rename this table.

create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  token uuid not null,
  version int not null,
  method text not null check (method in ('explicit', 'gpc', 'migrated')),
  gpc boolean not null default false,
  prefs jsonb not null,
  banner_version int not null,
  user_agent text,
  url text
);

create index if not exists consent_logs_token_idx on public.consent_logs (token);
create index if not exists consent_logs_created_at_idx on public.consent_logs (created_at desc);

alter table public.consent_logs enable row level security;

-- Anon can insert (log a decision) but never read, update, or delete other
-- visitors' rows — the browser writes directly with the anon/publishable key.
create policy "anon insert consent"
  on public.consent_logs
  for insert
  to anon
  with check (true);

revoke select, update, delete on public.consent_logs from anon;
grant insert on public.consent_logs to anon;
