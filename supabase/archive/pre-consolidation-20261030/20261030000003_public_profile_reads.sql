-- Guests may read public profile content and public profile media.
grant execute on function social.get_fursona_profile_by_identifier(text, uuid) to anon;
grant execute on function social.get_fursona_stats(uuid, uuid) to anon;
create policy public_profile_media_read on storage.objects for select to anon
using (
  bucket_id in ('fursona-avatars', 'fursona-banners')
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and social.can_view_fursona(null, ((storage.foldername(name))[1])::uuid)
);
