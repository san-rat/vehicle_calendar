alter table public.users            enable row level security;
alter table public.vehicles         enable row level security;
alter table public.privilege_config enable row level security;
alter table public.bookings         enable row level security;
alter table public.log_entries      enable row level security;

-- Authenticated users may read only their own application profile row.
-- Other app reads/writes use the service-role client, which bypasses RLS.
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select to authenticated using (auth.uid() = id);

-- vehicles, privilege_config, bookings, log_entries intentionally have no
-- policies. RLS on + no policy denies anon/authenticated clients by default.
