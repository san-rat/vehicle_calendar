create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
    and is_active = true
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'super_admin'::public.app_role
$$;

alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.privilege_config enable row level security;
alter table public.bookings enable row level security;
alter table public.log_entries enable row level security;

create policy users_select_self_or_admin
  on public.users
  for select
  to authenticated
  using (id = auth.uid() or public.is_super_admin());

create policy users_admin_insert
  on public.users
  for insert
  to authenticated
  with check (public.is_super_admin());

create policy users_admin_update
  on public.users
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy users_admin_delete
  on public.users
  for delete
  to authenticated
  using (public.is_super_admin());

create policy vehicles_select_active_or_admin
  on public.vehicles
  for select
  to authenticated
  using (is_active or public.is_super_admin());

create policy vehicles_admin_insert
  on public.vehicles
  for insert
  to authenticated
  with check (public.is_super_admin());

create policy vehicles_admin_update
  on public.vehicles
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy vehicles_admin_delete
  on public.vehicles
  for delete
  to authenticated
  using (public.is_super_admin());

create policy privilege_config_select_authenticated
  on public.privilege_config
  for select
  to authenticated
  using (auth.uid() is not null);

create policy privilege_config_admin_update
  on public.privilege_config
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy bookings_select_visible
  on public.bookings
  for select
  to authenticated
  using (
    status = 'confirmed'::public.booking_status
    or user_id = auth.uid()
    or public.is_super_admin()
  );

create policy bookings_admin_insert
  on public.bookings
  for insert
  to authenticated
  with check (public.is_super_admin());

create policy bookings_admin_update
  on public.bookings
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy bookings_admin_delete
  on public.bookings
  for delete
  to authenticated
  using (public.is_super_admin());

create policy log_entries_select_admin
  on public.log_entries
  for select
  to authenticated
  using (public.is_super_admin());

create policy log_entries_admin_insert
  on public.log_entries
  for insert
  to authenticated
  with check (public.is_super_admin());

create or replace function public.create_booking_with_conflict_lock(
  p_user_id uuid,
  p_vehicle_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_is_all_day boolean,
  p_reason text,
  p_status public.booking_status
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created public.bookings%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(p_vehicle_id::text), hashtext(p_date::text));

  if p_status = 'confirmed'::public.booking_status and exists (
    select 1
    from public.bookings b
    where b.vehicle_id = p_vehicle_id
      and b.date = p_date
      and b.status = 'confirmed'::public.booking_status
      and p_start_time < b.end_time
      and p_end_time > b.start_time
  ) then
    raise exception 'confirmed_booking_conflict'
      using errcode = '23P01';
  end if;

  insert into public.bookings (
    created_by,
    date,
    end_time,
    is_all_day,
    reason,
    start_time,
    status,
    updated_by,
    user_id,
    vehicle_id
  )
  values (
    p_user_id,
    p_date,
    p_end_time,
    p_is_all_day,
    p_reason,
    p_start_time,
    p_status,
    p_user_id,
    p_user_id,
    p_vehicle_id
  )
  returning * into v_created;

  return to_jsonb(v_created);
end;
$$;

create or replace function public.approve_booking_request_with_conflict_lock(
  p_booking_id uuid,
  p_actor_user_id uuid,
  p_allow_override boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.bookings%rowtype;
  v_updated public.bookings%rowtype;
  v_conflict_ids uuid[];
  v_conflict_before jsonb;
  v_overridden jsonb;
begin
  select *
  into v_before
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'booking_request_not_found'
      using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(v_before.vehicle_id::text),
    hashtext(v_before.date::text)
  );

  select *
  into v_before
  from public.bookings
  where id = p_booking_id
  for update;

  if v_before.status <> 'requested'::public.booking_status then
    raise exception 'booking_request_not_pending'
      using errcode = 'P0001';
  end if;

  select coalesce(array_agg(b.id), '{}')
  into v_conflict_ids
  from public.bookings b
  where b.vehicle_id = v_before.vehicle_id
    and b.date = v_before.date
    and b.status = 'confirmed'::public.booking_status
    and v_before.start_time < b.end_time
    and v_before.end_time > b.start_time;

  if cardinality(v_conflict_ids) > 0 and not p_allow_override then
    raise exception 'booking_conflict_requires_override'
      using errcode = '23P01';
  end if;

  select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb)
  into v_conflict_before
  from public.bookings b
  where b.id = any(v_conflict_ids);

  if cardinality(v_conflict_ids) > 0 then
    with updated_conflicts as (
      update public.bookings
      set
        status = 'overridden'::public.booking_status,
        updated_by = p_actor_user_id
      where id = any(v_conflict_ids)
        and status = 'confirmed'::public.booking_status
      returning *
    )
    select coalesce(jsonb_agg(to_jsonb(updated_conflicts)), '[]'::jsonb)
    into v_overridden
    from updated_conflicts;

    if jsonb_array_length(v_overridden) <> cardinality(v_conflict_ids) then
      raise exception 'booking_conflicts_changed'
        using errcode = '40001';
    end if;
  else
    v_overridden := '[]'::jsonb;
  end if;

  update public.bookings
  set
    status = 'confirmed'::public.booking_status,
    updated_by = p_actor_user_id
  where id = p_booking_id
    and status = 'requested'::public.booking_status
  returning * into v_updated;

  if not found then
    raise exception 'booking_request_not_pending'
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'before', to_jsonb(v_before),
    'updated', to_jsonb(v_updated),
    'overridden_bookings', v_overridden,
    'conflict_before_snapshots', v_conflict_before
  );
end;
$$;

revoke execute on function public.create_booking_with_conflict_lock(
  uuid,
  uuid,
  date,
  time,
  time,
  boolean,
  text,
  public.booking_status
) from public, anon, authenticated;

revoke execute on function public.approve_booking_request_with_conflict_lock(
  uuid,
  uuid,
  boolean
) from public, anon, authenticated;

grant execute on function public.create_booking_with_conflict_lock(
  uuid,
  uuid,
  date,
  time,
  time,
  boolean,
  text,
  public.booking_status
) to service_role;

grant execute on function public.approve_booking_request_with_conflict_lock(
  uuid,
  uuid,
  boolean
) to service_role;
