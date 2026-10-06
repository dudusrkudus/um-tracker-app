-- Enable PostGIS
create extension if not exists postgis schema extensions;
create extension if not exists pgcrypto schema extensions;

-- Updated at function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (
    role in (
      'admin',
      'race_director',
      'support_coordinator',
      'marshal',
      'runner',
      'viewer'
    )
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 2. Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  timezone text not null default 'Asia/Jakarta',
  start_name text,
  start_latitude double precision,
  start_longitude double precision,
  finish_name text,
  finish_latitude double precision,
  finish_longitude double precision,
  status text not null default 'draft' check (
    status in ('draft', 'ready', 'live', 'paused', 'completed', 'cancelled')
  ),
  stale_warning_minutes integer not null default 15,
  stale_critical_minutes integer not null default 30,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_events_updated
  before update on public.events
  for each row execute procedure public.handle_updated_at();

-- 3. Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('R1', 'R2', 'R4', 'R8', 'R16')),
  runner_capacity integer not null check (runner_capacity > 0),
  created_at timestamptz not null default now()
);

-- Seed Categories
insert into public.categories (code, runner_capacity)
values
  ('R1', 1),
  ('R2', 2),
  ('R4', 4),
  ('R8', 8),
  ('R16', 16)
on conflict (code) do nothing;

-- 4. Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  team_code text not null,
  team_name text not null,
  captain_name text,
  captain_phone text,
  support_vehicle text,
  support_pic text,
  status text not null default 'not_started' check (
    status in (
      'not_started',
      'checked_in',
      'running',
      'waiting_relay',
      'resting',
      'attention',
      'emergency',
      'finished',
      'dnf',
      'unknown'
    )
  ),
  last_known_latitude double precision,
  last_known_longitude double precision,
  last_location_at timestamptz,
  last_location_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, team_code)
);

create trigger on_teams_updated
  before update on public.teams
  for each row execute procedure public.handle_updated_at();

-- 5. Runners
create table public.runners (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id),
  full_name text not null,
  phone text,
  relay_order integer not null check (relay_order > 0),
  emergency_contact_name text,
  emergency_contact_phone text,
  status text not null default 'not_started' check (
    status in (
      'not_started',
      'running',
      'completed_leg',
      'waiting_relay',
      'resting',
      'injured',
      'evacuated',
      'not_detected',
      'finished'
    )
  ),
  tracking_token_hash text,
  is_tracking_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, relay_order)
);

create trigger on_runners_updated
  before update on public.runners
  for each row execute procedure public.handle_updated_at();

-- 6. Checkpoints
create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code text not null,
  name text not null,
  sequence_no integer not null,
  distance_km numeric(8,2),
  latitude double precision not null,
  longitude double precision not null,
  geofence_radius_m integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, code),
  unique (event_id, sequence_no)
);

-- 7. Runner Locations
create table public.runner_locations (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  runner_id uuid references public.runners(id) on delete set null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m numeric(10,2),
  speed_kmh numeric(10,2),
  heading numeric(6,2),
  battery_level integer check (battery_level between 0 and 100),
  source text not null check (
    source in ('web_gps', 'telegram', 'manual', 'checkpoint', 'import')
  ),
  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index runner_locations_team_time_idx on public.runner_locations (team_id, recorded_at desc);
create index runner_locations_event_time_idx on public.runner_locations (event_id, recorded_at desc);
create index runner_locations_source_idx on public.runner_locations (source);

-- 8. Checkpoint Logs
create table public.checkpoint_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  checkpoint_id uuid not null references public.checkpoints(id),
  team_id uuid not null references public.teams(id) on delete cascade,
  runner_id uuid references public.runners(id) on delete set null,
  arrived_at timestamptz not null,
  departed_at timestamptz,
  relay_changed boolean not null default false,
  next_runner_id uuid references public.runners(id) on delete set null,
  notes text,
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 9. Incidents
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  runner_id uuid references public.runners(id) on delete set null,
  type text not null check (
    type in (
      'injury',
      'lost_contact',
      'vehicle_problem',
      'supplies',
      'gps_problem',
      'stopped',
      'off_route',
      'pickup_request',
      'other'
    )
  ),
  severity text not null default 'medium' check (
    severity in ('low', 'medium', 'high', 'emergency')
  ),
  status text not null default 'open' check (
    status in ('open', 'acknowledged', 'in_progress', 'resolved', 'cancelled')
  ),
  description text not null,
  latitude double precision,
  longitude double precision,
  assigned_to uuid references public.profiles(id),
  reported_by uuid references public.profiles(id),
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_incidents_updated
  before update on public.incidents
  for each row execute procedure public.handle_updated_at();

-- 10. Audit Logs
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  source text,
  created_at timestamptz not null default now()
);

-- 11. Telegram Connections
create table public.telegram_connections (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id text not null unique,
  telegram_chat_id text,
  runner_id uuid references public.runners(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  is_active boolean not null default true,
  connected_at timestamptz not null default now(),
  last_message_at timestamptz
);

-- 12. Notification Events
create table public.notification_events (
  id bigint generated always as identity primary key,
  event_id uuid references public.events(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  incident_id uuid references public.incidents(id) on delete cascade,
  type text not null,
  channel text not null check (
    channel in ('in_app', 'telegram', 'email')
  ),
  message text not null,
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'failed', 'cancelled')
  ),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

-- RLS & Authorization Helpers
create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = required_role
      and is_active = true
  );
$$;

create or replace function public.has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = any(required_roles)
      and is_active = true
  );
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.categories enable row level security;
alter table public.teams enable row level security;
alter table public.runners enable row level security;
alter table public.checkpoints enable row level security;
alter table public.runner_locations enable row level security;
alter table public.checkpoint_logs enable row level security;
alter table public.incidents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.telegram_connections enable row level security;
alter table public.notification_events enable row level security;

-- Policies for Events
revoke all on table public.events from anon;
grant select on table public.events to authenticated;
grant insert, update, delete on table public.events to authenticated;

create policy "staff can view events" on public.events for select to authenticated
using (public.has_any_role(array['admin', 'race_director', 'support_coordinator', 'marshal', 'viewer']));

create policy "admin can create events" on public.events for insert to authenticated
with check (public.has_any_role(array['admin']));

create policy "admin or director can update events" on public.events for update to authenticated
using (public.has_any_role(array['admin', 'race_director']))
with check (public.has_any_role(array['admin', 'race_director']));

-- Basic Policies (Admin has full access)
create policy "admin_all_profiles" on public.profiles for all to authenticated using (public.has_role('admin'));
create policy "admin_all_categories" on public.categories for all to authenticated using (public.has_role('admin'));
create policy "admin_all_teams" on public.teams for all to authenticated using (public.has_role('admin'));
create policy "admin_all_runners" on public.runners for all to authenticated using (public.has_role('admin'));
create policy "admin_all_checkpoints" on public.checkpoints for all to authenticated using (public.has_role('admin'));

-- Viewers / Everyone can view active categories
create policy "anyone_view_categories" on public.categories for select to authenticated using (true);

-- User profile access
create policy "users_view_own_profile" on public.profiles for select to authenticated using (auth.uid() = id);
