insert into public.privilege_config (
  time_limit_minutes,
  allow_booking_freedom,
  max_days_in_future,
  require_reason
)
values (
  null,
  false,
  30,
  false
)
on conflict do nothing;

insert into public.vehicles (name, type)
values
  ('Pool Car 1', 'car'),
  ('Pool Van 1', 'van')
on conflict do nothing;

-- Create the first admin user in Supabase Auth first.
-- The trigger in 0001_init_schema.sql will automatically create the linked
-- public.users row as soon as the auth user exists.
--
-- After creating that auth user, replace the email below and run this update
-- to promote the linked profile to super_admin.
--
-- update public.users
-- set
--   role = 'super_admin',
--   color_hex = '#3B82F6',
--   updated_at = now()
-- where id = (
--   select id
--   from auth.users
--   where email = 'replace-with-admin-email@example.com'
-- );
