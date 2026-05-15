create or replace function public.lookup_auth_email_by_name(p_name text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select auth_user.email
  from public.users app_user
  join auth.users auth_user on auth_user.id = app_user.id
  where lower(app_user.name) = lower(btrim(p_name))
    and app_user.is_active = true
  limit 1
$$;

revoke execute on function public.lookup_auth_email_by_name(text) from public;
grant execute on function public.lookup_auth_email_by_name(text) to anon, authenticated;
