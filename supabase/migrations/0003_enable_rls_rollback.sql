drop policy if exists users_select_self on public.users;

alter table public.users            disable row level security;
alter table public.vehicles         disable row level security;
alter table public.privilege_config disable row level security;
alter table public.bookings         disable row level security;
alter table public.log_entries      disable row level security;
