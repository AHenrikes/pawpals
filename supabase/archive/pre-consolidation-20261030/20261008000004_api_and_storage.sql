-- Public RPC entry points and profile-media Storage policies.
create function public.create_account(
  p_email text,
  p_display_name text,
  p_username text,
  p_first_name text default null,
  p_last_name text default null,
  p_date_of_birth date default null,
  p_species text default null,
  p_pronouns text default null,
  p_bio text default null
)
returns jsonb language sql security invoker set search_path = pg_catalog
as $$
  select core.create_account(p_email, p_display_name, p_username, p_first_name, p_last_name, p_date_of_birth, p_species, p_pronouns, p_bio);
$$;

create function public.create_fursona(
  p_display_name text,
  p_username text,
  p_species text default null,
  p_pronouns text default null,
  p_bio text default null
)
returns uuid language sql security invoker set search_path = pg_catalog
as $$ select core.create_fursona(p_display_name, p_username, p_species, p_pronouns, p_bio); $$;

create function public.set_default_fursona(p_fursona_id uuid)
returns void language sql security invoker set search_path = pg_catalog
as $$ select core.set_default_fursona(p_fursona_id); $$;

create function public.request_follow(p_actor_fursona_id uuid, p_target_fursona_id uuid)
returns social.follow_status language sql security invoker set search_path = pg_catalog
as $$ select social.request_follow(p_actor_fursona_id, p_target_fursona_id); $$;

revoke all on function public.create_account(text, text, text, text, text, date, text, text, text) from public, anon;
revoke all on function public.create_fursona(text, text, text, text, text) from public, anon;
revoke all on function public.set_default_fursona(uuid) from public, anon;
revoke all on function public.request_follow(uuid, uuid) from public, anon;
grant execute on function public.create_account(text, text, text, text, text, date, text, text, text) to authenticated;
grant execute on function public.create_fursona(text, text, text, text, text) to authenticated;
grant execute on function public.set_default_fursona(uuid) to authenticated;
grant execute on function public.request_follow(uuid, uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fursona-avatars', 'fursona-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('fursona-banners', 'fursona-banners', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatar_insert_owned on storage.objects for insert to authenticated
with check (
  bucket_id = 'fursona-avatars'
  and exists (select 1 from core.fursonas f where f.id::text = (storage.foldername(name))[1] and core.owns_fursona(f.id))
);
create policy avatar_update_owned on storage.objects for update to authenticated
using (bucket_id = 'fursona-avatars' and exists (select 1 from core.fursonas f where f.id::text = (storage.foldername(name))[1] and core.owns_fursona(f.id)))
with check (bucket_id = 'fursona-avatars' and exists (select 1 from core.fursonas f where f.id::text = (storage.foldername(name))[1] and core.owns_fursona(f.id)));
create policy avatar_delete_owned on storage.objects for delete to authenticated
using (bucket_id = 'fursona-avatars' and exists (select 1 from core.fursonas f where f.id::text = (storage.foldername(name))[1] and core.owns_fursona(f.id)));

create policy banner_insert_owned on storage.objects for insert to authenticated
with check (
  bucket_id = 'fursona-banners'
  and exists (select 1 from core.fursonas f where f.id::text = (storage.foldername(name))[1] and core.owns_fursona(f.id))
);
create policy banner_update_owned on storage.objects for update to authenticated
using (bucket_id = 'fursona-banners' and exists (select 1 from core.fursonas f where f.id::text = (storage.foldername(name))[1] and core.owns_fursona(f.id)))
with check (bucket_id = 'fursona-banners' and exists (select 1 from core.fursonas f where f.id::text = (storage.foldername(name))[1] and core.owns_fursona(f.id)));
create policy banner_delete_owned on storage.objects for delete to authenticated
using (bucket_id = 'fursona-banners' and exists (select 1 from core.fursonas f where f.id::text = (storage.foldername(name))[1] and core.owns_fursona(f.id)));
