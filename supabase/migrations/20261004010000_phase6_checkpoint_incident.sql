-- Phase 6: Checkpoint logs, relay change, incidents, and audit trail
--
-- * Read access for operational staff on master data (was admin-only).
-- * RLS for checkpoint_logs, incidents, audit_logs.
-- * record_checkpoint_log(): single atomic RPC for checkpoint logging and relay changes.
-- * Generic audit trigger for important tables.

-- ---------------------------------------------------------------------------
-- Role groups (documentation)
--   staff_read   : admin, race_director, support_coordinator, marshal, viewer
--   staff_write  : admin, race_director, support_coordinator, marshal
--   incident_mgr : admin, race_director, support_coordinator
-- ---------------------------------------------------------------------------

-- 1. Master data read access for staff -------------------------------------
create policy "staff_view_teams" on public.teams for select to authenticated
using (public.has_any_role(array['admin', 'race_director', 'support_coordinator', 'marshal', 'viewer']));

create policy "staff_view_runners" on public.runners for select to authenticated
using (public.has_any_role(array['admin', 'race_director', 'support_coordinator', 'marshal', 'viewer']));

create policy "staff_view_checkpoints" on public.checkpoints for select to authenticated
using (public.has_any_role(array['admin', 'race_director', 'support_coordinator', 'marshal', 'viewer']));

-- Needed to pick a PIC and to show reporter / recorder names.
create policy "staff_view_profiles" on public.profiles for select to authenticated
using (public.has_any_role(array['admin', 'race_director', 'support_coordinator', 'marshal']));

-- 2. Checkpoint logs ---------------------------------------------------------
-- Writes go exclusively through record_checkpoint_log() (security definer),
-- so the team/runner/location side effects stay atomic.
revoke all on table public.checkpoint_logs from anon;
revoke insert, update, delete on table public.checkpoint_logs from authenticated;
grant select on table public.checkpoint_logs to authenticated;

create policy "staff_view_checkpoint_logs" on public.checkpoint_logs for select to authenticated
using (public.has_any_role(array['admin', 'race_director', 'support_coordinator', 'marshal', 'viewer']));

-- 3. Incidents ---------------------------------------------------------------
revoke all on table public.incidents from anon;
revoke delete on table public.incidents from authenticated; -- use status = 'cancelled'
grant select, insert, update on table public.incidents to authenticated;

create policy "staff_view_incidents" on public.incidents for select to authenticated
using (public.has_any_role(array['admin', 'race_director', 'support_coordinator', 'marshal', 'viewer']));

create policy "staff_create_incidents" on public.incidents for insert to authenticated
with check (
  public.has_any_role(array['admin', 'race_director', 'support_coordinator', 'marshal'])
  and reported_by = (select auth.uid())
);

create policy "managers_or_pic_update_incidents" on public.incidents for update to authenticated
using (
  public.has_any_role(array['admin', 'race_director', 'support_coordinator'])
  or (assigned_to = (select auth.uid()) and public.has_any_role(array['marshal']))
)
with check (
  public.has_any_role(array['admin', 'race_director', 'support_coordinator'])
  or (assigned_to = (select auth.uid()) and public.has_any_role(array['marshal']))
);

create index if not exists incidents_event_status_idx on public.incidents (event_id, status, severity);
create index if not exists checkpoint_logs_team_idx on public.checkpoint_logs (team_id, arrived_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);

-- 4. Audit logs --------------------------------------------------------------
-- Append-only; rows are written by the security-definer trigger below.
revoke all on table public.audit_logs from anon;
revoke insert, update, delete on table public.audit_logs from authenticated;
grant select on table public.audit_logs to authenticated;

create policy "managers_view_audit_logs" on public.audit_logs for select to authenticated
using (public.has_any_role(array['admin', 'race_director', 'support_coordinator']));

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_actor uuid;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    -- Skip no-op updates
    if (v_old - 'updated_at') = (v_new - 'updated_at') then
      return new;
    end if;
  else
    v_old := to_jsonb(old);
  end if;

  -- actor_id references profiles; only set it when a profile exists
  select p.id into v_actor from public.profiles p where p.id = (select auth.uid());

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_data, new_data, source)
  values (
    v_actor,
    lower(tg_op),
    tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id'),
    v_old,
    v_new,
    coalesce(nullif(current_setting('app.audit_source', true), ''), 'web')
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.audit_row_change() from public, anon, authenticated;

create trigger audit_incidents
  after insert or update or delete on public.incidents
  for each row execute function public.audit_row_change();

create trigger audit_checkpoint_logs
  after insert or update or delete on public.checkpoint_logs
  for each row execute function public.audit_row_change();

create trigger audit_checkpoints
  after insert or update or delete on public.checkpoints
  for each row execute function public.audit_row_change();

create trigger audit_teams_insert_delete
  after insert or delete on public.teams
  for each row execute function public.audit_row_change();

-- Location updates on teams are high-volume; only audit meaningful changes.
create trigger audit_teams_update
  after update on public.teams
  for each row
  when (
    old.status is distinct from new.status
    or old.team_code is distinct from new.team_code
    or old.team_name is distinct from new.team_name
    or old.category_id is distinct from new.category_id
    or old.support_pic is distinct from new.support_pic
  )
  execute function public.audit_row_change();

create trigger audit_runners_insert_delete
  after insert or delete on public.runners
  for each row execute function public.audit_row_change();

create trigger audit_runners_update
  after update on public.runners
  for each row
  when (
    old.status is distinct from new.status
    or old.relay_order is distinct from new.relay_order
    or old.full_name is distinct from new.full_name
    or old.team_id is distinct from new.team_id
  )
  execute function public.audit_row_change();

create trigger audit_profiles_role
  after update on public.profiles
  for each row
  when (old.role is distinct from new.role or old.is_active is distinct from new.is_active)
  execute function public.audit_row_change();

-- 5. Checkpoint logging / relay change RPC -----------------------------------
create or replace function public.record_checkpoint_log(
  p_team_id uuid,
  p_checkpoint_id uuid,
  p_arrived_at timestamptz,
  p_runner_id uuid default null,
  p_departed_at timestamptz default null,
  p_relay_changed boolean default false,
  p_next_runner_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_team public.teams%rowtype;
  v_cp public.checkpoints%rowtype;
  v_log_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if not public.has_any_role(array['admin', 'race_director', 'support_coordinator', 'marshal']) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_team from public.teams where id = p_team_id for update;
  if not found then
    raise exception 'INVALID_INPUT: team not found' using errcode = '22023';
  end if;

  select * into v_cp
  from public.checkpoints
  where id = p_checkpoint_id and event_id = v_team.event_id and is_active = true;
  if not found then
    raise exception 'INVALID_INPUT: checkpoint does not belong to this event' using errcode = '22023';
  end if;

  if p_runner_id is not null and not exists (
    select 1 from public.runners where id = p_runner_id and team_id = p_team_id
  ) then
    raise exception 'INVALID_INPUT: runner is not in this team' using errcode = '22023';
  end if;

  if p_arrived_at > now() + interval '5 minutes' then
    raise exception 'INVALID_INPUT: arrival time is in the future' using errcode = '22023';
  end if;

  if p_departed_at is not null and p_departed_at < p_arrived_at then
    raise exception 'INVALID_INPUT: departure is before arrival' using errcode = '22023';
  end if;

  if p_relay_changed then
    if p_runner_id is null or p_next_runner_id is null then
      raise exception 'INVALID_INPUT: relay change needs outgoing and next runner' using errcode = '22023';
    end if;
    if p_runner_id = p_next_runner_id then
      raise exception 'INVALID_INPUT: next runner must be different' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.runners where id = p_next_runner_id and team_id = p_team_id
    ) then
      raise exception 'INVALID_INPUT: next runner is not in this team' using errcode = '22023';
    end if;
  elsif p_next_runner_id is not null then
    raise exception 'INVALID_INPUT: next runner only allowed on relay change' using errcode = '22023';
  end if;

  -- One arrival log and one relay log per team per checkpoint
  if exists (
    select 1 from public.checkpoint_logs
    where team_id = p_team_id
      and checkpoint_id = p_checkpoint_id
      and relay_changed = p_relay_changed
  ) then
    raise exception 'DUPLICATE_CHECKPOINT_LOG' using errcode = '23505';
  end if;

  insert into public.checkpoint_logs (
    event_id, checkpoint_id, team_id, runner_id, arrived_at, departed_at,
    relay_changed, next_runner_id, notes, recorded_by
  ) values (
    v_team.event_id, p_checkpoint_id, p_team_id, p_runner_id, p_arrived_at, p_departed_at,
    p_relay_changed, p_next_runner_id, nullif(trim(p_notes), ''), v_uid
  )
  returning id into v_log_id;

  -- A checkpoint passage is also a known location
  insert into public.runner_locations (
    event_id, team_id, runner_id, latitude, longitude, source, recorded_at, metadata
  ) values (
    v_team.event_id, p_team_id, p_runner_id, v_cp.latitude, v_cp.longitude, 'checkpoint', p_arrived_at,
    jsonb_build_object('checkpoint_id', p_checkpoint_id, 'checkpoint_log_id', v_log_id)
  );

  update public.teams
  set last_known_latitude = v_cp.latitude,
      last_known_longitude = v_cp.longitude,
      last_location_at = p_arrived_at,
      last_location_source = 'checkpoint'
  where id = p_team_id
    and (last_location_at is null or last_location_at <= p_arrived_at);

  if p_relay_changed then
    update public.runners set status = 'completed_leg' where id = p_runner_id;
    update public.runners set status = 'running' where id = p_next_runner_id;
  elsif p_runner_id is not null then
    update public.runners set status = 'running'
    where id = p_runner_id and status in ('not_started', 'waiting_relay', 'not_detected');
  end if;

  -- Never override attention / emergency / finished / dnf automatically
  update public.teams set status = 'running'
  where id = p_team_id
    and status in ('not_started', 'checked_in', 'waiting_relay', 'resting', 'unknown');

  return v_log_id;
end;
$$;

revoke all on function public.record_checkpoint_log(uuid, uuid, timestamptz, uuid, timestamptz, boolean, uuid, text) from public, anon;
grant execute on function public.record_checkpoint_log(uuid, uuid, timestamptz, uuid, timestamptz, boolean, uuid, text) to authenticated;
