-- Owners can manage their uploads. Other members can read only images currently
-- referenced by an active profile; replaced files must not remain public.
create or replace function social.can_read_profile_media(p_bucket text, p_name text)
returns boolean language sql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
  select auth.uid() is not null and exists (
    select 1 from core.fursonas f
    join core.accounts a on a.id = f.account_id
    where f.id::text = split_part(p_name, '/', 1)
      and f.status = 'active' and a.status in ('active', 'at_risk')
      and (
        core.owns_fursona(f.id, false)
        or (p_bucket = 'fursona-avatars'
          and f.avatar_url = '/api/media/fursona-avatars/' || p_name)
        or (p_bucket = 'fursona-banners'
          and f.banner_url = '/api/media/fursona-banners/' || p_name)
      )
  );
$$;
revoke all on function social.can_read_profile_media(text, text) from public, anon;
grant execute on function social.can_read_profile_media(text, text) to authenticated;

drop policy if exists profile_media_read on storage.objects;
create policy profile_media_read on storage.objects for select to authenticated
using (
  bucket_id in ('fursona-avatars', 'fursona-banners')
  and social.can_read_profile_media(bucket_id, name)
);
