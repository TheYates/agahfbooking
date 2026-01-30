-- Push notification persistence tables (Supabase)
-- Date: 2026-01-30

-- 1) Store a user's push subscription(s)
-- We key primarily by endpoint because browsers can rotate subscription endpoints.

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id text not null,
  endpoint text not null unique,
  p256dh text,
  auth text,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

-- 2) Store scheduled reminders (for later sending)
-- This does NOT implement delivery; it only persists intent.

create table if not exists public.push_reminders (
  id bigserial primary key,
  appointment_id text not null unique,
  user_id text not null,
  title text not null,
  body text not null default '',
  scheduled_time timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_reminders_user_id_idx on public.push_reminders(user_id);
create index if not exists push_reminders_scheduled_time_idx on public.push_reminders(scheduled_time);
create index if not exists push_reminders_appointment_id_idx on public.push_reminders(appointment_id);

-- Trigger function to keep updated_at current (optional)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_push_subscriptions_updated_at'
  ) then
    create trigger set_push_subscriptions_updated_at
    before update on public.push_subscriptions
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_push_reminders_updated_at'
  ) then
    create trigger set_push_reminders_updated_at
    before update on public.push_reminders
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- NOTE: RLS policies should be added to restrict access.
-- Suggested:
--   - Users can select/insert/update/delete their own subscriptions/reminders
--   - Admin/service role can manage all
