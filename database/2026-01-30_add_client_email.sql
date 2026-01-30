-- Add email support for client Email OTP (Supabase Auth)
-- Note: Apply this in Supabase SQL editor / migrations.

alter table if exists public.clients
  add column if not exists email text;

-- Optional: enforce uniqueness when populated
create unique index if not exists clients_email_unique
  on public.clients (email)
  where email is not null;

-- Helpful index for lookups
create index if not exists clients_x_number_idx
  on public.clients (x_number);
