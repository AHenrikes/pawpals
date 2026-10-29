-- Profile data and media belong to the signed-in app. Anonymous visitors may
-- still check username availability during sign-up.
revoke execute on function social.can_view_fursona(uuid, uuid) from public, anon;
revoke execute on function social.get_fursona_profile(uuid, uuid) from public, anon;
revoke execute on function social.get_fursona_profile_by_identifier(text, uuid) from public, anon;
revoke execute on function social.get_fursona_stats(uuid, uuid) from public, anon;
revoke usage on schema social from anon;

drop policy if exists public_profile_media_read on storage.objects;
