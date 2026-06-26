create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    vehicle_id with =,
    tsrange((date + start_time), (date + end_time)) with &&
  ) where (status = 'confirmed');
