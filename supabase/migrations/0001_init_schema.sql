create extension if not exists pgcrypto;

create type public.app_role as enum ('member', 'super_admin');
create type public.vehicle_type as enum ('car', 'van', 'jeep', 'bike', 'suv', 'other');
create type public.booking_status as enum (
  'requested',
  'confirmed',
  'rejected',
  'cancelled',
  'overridden'
);
create type public.log_action_type as enum (
  'booking_requested',
  'booking_confirmed',
  'booking_rejected',
  'booking_cancelled',
  'booking_overridden',
  'vehicle_created',
  'vehicle_updated',
  'vehicle_deleted',
  'member_created',
  'member_updated',
  'member_deleted',
  'member_role_changed',
  'member_password_reset',
  'privilege_updated'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.app_role not null default 'member',
  color_hex text not null default '#3B82F6',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_name_not_blank check (btrim(name) <> ''),
  constraint users_color_hex_format check (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index users_name_unique_idx on public.users (lower(name));

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.vehicle_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_name_not_blank check (btrim(name) <> '')
);

create unique index vehicles_name_unique_idx on public.vehicles (lower(name));

create table public.privilege_config (
  id uuid primary key default gen_random_uuid(),
  time_limit_minutes integer,
  allow_booking_freedom boolean not null default false,
  max_days_in_future integer not null default 30,
  require_reason boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint privilege_config_time_limit_check
    check (time_limit_minutes is null or time_limit_minutes > 0),
  constraint privilege_config_future_window_check
    check (max_days_in_future >= 0)
);

create unique index privilege_config_singleton_idx on public.privilege_config ((true));

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  is_all_day boolean not null default false,
  reason text,
  status public.booking_status not null default 'requested',
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_window_check check (
    (is_all_day and start_time = time '00:00' and end_time = time '23:59')
    or
    (not is_all_day and start_time < end_time)
  )
);

create index bookings_vehicle_date_idx on public.bookings (vehicle_id, date);

create table public.log_entries (
  id uuid primary key default gen_random_uuid(),
  action_at timestamptz not null default now(),
  actor_user_id uuid references public.users(id) on delete set null,
  action_type public.log_action_type not null,
  description text not null,
  snapshot jsonb not null default '{}'::jsonb,
  booking_id uuid references public.bookings(id) on delete set null,
  target_user_id uuid references public.users(id) on delete set null,
  target_vehicle_id uuid references public.vehicles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint log_entries_description_not_blank check (btrim(description) <> '')
);

create index log_entries_created_at_idx on public.log_entries (created_at);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_name text;
  final_name text;
  id_suffix text;
begin
  requested_name := nullif(btrim(new.raw_user_meta_data ->> 'name'), '');
  id_suffix := left(replace(new.id::text, '-', ''), 8);
  final_name := coalesce(requested_name, 'user-' || id_suffix);

  if exists (
    select 1
    from public.users
    where lower(name) = lower(final_name)
  ) then
    final_name := final_name || '-' || left(id_suffix, 4);
  end if;

  insert into public.users (id, name)
  values (new.id, final_name);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

create trigger set_users_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

create trigger set_vehicles_updated_at
  before update on public.vehicles
  for each row
  execute function public.set_updated_at();

create trigger set_privilege_config_updated_at
  before update on public.privilege_config
  for each row
  execute function public.set_updated_at();

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row
  execute function public.set_updated_at();
