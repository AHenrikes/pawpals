-- MEDIA baseline. New projects only; see README.md before replacing applied history.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fursona-avatars', 'fursona-avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('fursona-banners', 'fursona-banners', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

CREATE POLICY avatar_delete_owned ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'fursona-avatars'::text) AND (EXISTS ( SELECT 1
   FROM core.fursonas f
  WHERE (((f.id)::text = (storage.foldername(objects.name))[1]) AND core.owns_fursona(f.id))))));

CREATE POLICY avatar_insert_owned ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'fursona-avatars'::text) AND (EXISTS ( SELECT 1
   FROM core.fursonas f
  WHERE (((f.id)::text = (storage.foldername(objects.name))[1]) AND core.owns_fursona(f.id))))));

CREATE POLICY avatar_update_owned ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'fursona-avatars'::text) AND (EXISTS ( SELECT 1
   FROM core.fursonas f
  WHERE (((f.id)::text = (storage.foldername(objects.name))[1]) AND core.owns_fursona(f.id)))))) WITH CHECK (((bucket_id = 'fursona-avatars'::text) AND (EXISTS ( SELECT 1
   FROM core.fursonas f
  WHERE (((f.id)::text = (storage.foldername(objects.name))[1]) AND core.owns_fursona(f.id))))));

CREATE POLICY banner_delete_owned ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'fursona-banners'::text) AND (EXISTS ( SELECT 1
   FROM core.fursonas f
  WHERE (((f.id)::text = (storage.foldername(objects.name))[1]) AND core.owns_fursona(f.id))))));

CREATE POLICY banner_insert_owned ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'fursona-banners'::text) AND (EXISTS ( SELECT 1
   FROM core.fursonas f
  WHERE (((f.id)::text = (storage.foldername(objects.name))[1]) AND core.owns_fursona(f.id))))));

CREATE POLICY banner_update_owned ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'fursona-banners'::text) AND (EXISTS ( SELECT 1
   FROM core.fursonas f
  WHERE (((f.id)::text = (storage.foldername(objects.name))[1]) AND core.owns_fursona(f.id)))))) WITH CHECK (((bucket_id = 'fursona-banners'::text) AND (EXISTS ( SELECT 1
   FROM core.fursonas f
  WHERE (((f.id)::text = (storage.foldername(objects.name))[1]) AND core.owns_fursona(f.id))))));

CREATE POLICY profile_media_read ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = ANY (ARRAY['fursona-avatars'::text, 'fursona-banners'::text])) AND ((storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'::text) AND (social.can_view_fursona(NULL::uuid, ((storage.foldername(name))[1])::uuid) OR (EXISTS ( SELECT 1
   FROM (social.follows follow
     JOIN core.fursonas viewer ON ((viewer.id = follow.follower_fursona_id)))
  WHERE ((viewer.account_id = core.current_account_id()) AND (follow.followed_fursona_id = ((storage.foldername(objects.name))[1])::uuid) AND (follow.status = 'accepted'::social.follow_status)))))));
