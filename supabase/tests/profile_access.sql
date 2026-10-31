begin;
select plan(38);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('a1111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'profile-owner@example.test', now(), now()),
  ('a2222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'profile-follower@example.test', now(), now()),
  ('a3333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'profile-stranger@example.test', now(), now());
insert into core.accounts (id, user_id) values
  ('b1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111'),
  ('b2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222'),
  ('b3333333-3333-4333-8333-333333333333', 'a3333333-3333-4333-8333-333333333333');
insert into core.fursonas (id, account_id, username, display_name, bio, species) values
  ('c1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111', 'profile_target', 'Target', 'Protected biography', 'Wolf'),
  ('c2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222', 'profile_viewer', 'Viewer', null, null),
  ('c3333333-3333-4333-8333-333333333333', 'b3333333-3333-4333-8333-333333333333', 'profile_stranger', 'Stranger', null, null);

select is((select updated_at from core.fursonas where username = 'profile_target'), null::timestamptz, 'new profile has no edit timestamp');
update core.fursonas set display_name = display_name where username = 'profile_target';
select is((select updated_at from core.fursonas where username = 'profile_target'), null::timestamptz, 'no-op update does not count as an edit');
select is((select profile_theme from core.fursonas where username = 'profile_target'), 'dark', 'profile has its own stored theme');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select is((select bio from social.get_fursona_profile_by_identifier('profile_target', 'c2222222-2222-4222-8222-222222222222')), 'Protected biography', 'public content is visible');
select is((select can_view_content from social.get_fursona_profile_by_identifier('profile_target', 'c2222222-2222-4222-8222-222222222222')), true, 'public profile grants content access');
reset role;
select ok(not has_schema_privilege('anon', 'social', 'USAGE'), 'guest cannot access the social schema');
select ok(not has_function_privilege('anon', 'social.can_view_fursona(uuid, uuid)', 'EXECUTE'), 'guest cannot call profile visibility helper');
select ok(not has_function_privilege('anon', 'social.get_fursona_profile(uuid, uuid)', 'EXECUTE'), 'guest cannot read profiles by ID');
select ok(not has_function_privilege('anon', 'social.get_fursona_profile_by_identifier(text, uuid)', 'EXECUTE'), 'guest cannot read profiles by identifier');
select ok(not has_function_privilege('anon', 'social.get_fursona_stats(uuid, uuid)', 'EXECUTE'), 'guest cannot read profile stats');
select ok(not has_function_privilege('anon', 'core.search_fursonas(text)', 'EXECUTE'), 'guest cannot search profiles');
select is((select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public_profile_media_read'), 0::bigint, 'guest media read policy is removed');
select ok(has_function_privilege('anon', 'public.check_username_availability(text)', 'EXECUTE'), 'guest can still check username availability during sign-up');

update core.fursonas set visibility = 'private' where username = 'profile_target';
select ok((select updated_at is not null from core.fursonas where username = 'profile_target'), 'edit advances profile timestamp');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select is((select bio from social.get_fursona_profile_by_identifier('profile_target', 'c2222222-2222-4222-8222-222222222222')), 'Protected biography', 'profile biography stays visible to signed-in users');
select is((select can_view_content from social.get_fursona_profile_by_identifier('profile_target', 'c2222222-2222-4222-8222-222222222222')), false, 'private posts are gated');
select is((select bio from social.get_fursona_profile('c1111111-1111-4111-8111-111111111111', 'c2222222-2222-4222-8222-222222222222')), 'Protected biography', 'profile lookup by ID is visible without following');
select is((select count(*) from core.search_fursonas('profile_target')), 1::bigint, 'restricted profile remains searchable');
select is((select species from core.search_fursonas('profile_target')), 'Wolf', 'search shows profile details');
select is(public.request_follow('c2222222-2222-4222-8222-222222222222', 'c1111111-1111-4111-8111-111111111111')::text, 'pending', 'follow request awaits approval');
select is((select can_view_content from social.get_fursona_profile_by_identifier('profile_target', 'c2222222-2222-4222-8222-222222222222')), false, 'pending request grants no access');
select throws_ok($$select public.respond_follow('c1111111-1111-4111-8111-111111111111', 'c2222222-2222-4222-8222-222222222222', true)$$, '42501', 'acting fursona not owned', 'requester cannot approve own request');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select lives_ok($$update core.fursonas set profile_theme = 'light' where username = 'profile_target'$$, 'owner can save profile theme');
select lives_ok($$update core.fursonas set display_name = 'Target', species = 'Wolf', pronouns = null, bio = 'Protected biography', visibility = 'private', profile_theme = 'light', social_links = '[]'::jsonb, show_events = true, show_communities = true, featured_achievements = '{}'::text[] where username = 'profile_target'$$, 'owner can save the full profile-settings payload');
select is((select count(*) from public.pending_follows('c1111111-1111-4111-8111-111111111111')), 1::bigint, 'owner sees pending requests');
select lives_ok($$select public.respond_follow('c1111111-1111-4111-8111-111111111111', 'c2222222-2222-4222-8222-222222222222', true)$$, 'owner can approve');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select is((select bio from social.get_fursona_profile_by_identifier('profile_target', 'c2222222-2222-4222-8222-222222222222')), 'Protected biography', 'approved follower reads followers-only content');
reset role;

update core.fursonas set visibility = 'private' where username = 'profile_target';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select is((select bio from social.get_fursona_profile_by_identifier('profile_target', 'c2222222-2222-4222-8222-222222222222')), 'Protected biography', 'approved follower reads private content');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a3333333-3333-4333-8333-333333333333', true);
select is((select bio from social.get_fursona_profile_by_identifier('profile_target', 'c3333333-3333-4333-8333-333333333333')), 'Protected biography', 'stranger can read private profile details');
select is((select can_view_content from social.get_fursona_profile_by_identifier('profile_target', 'c3333333-3333-4333-8333-333333333333')), false, 'stranger cannot read private posts');
select is((select count(*) from core.search_fursonas('profile_target')), 1::bigint, 'private profile remains searchable');
select is(public.request_follow('c3333333-3333-4333-8333-333333333333', 'c1111111-1111-4111-8111-111111111111')::text, 'pending', 'private profile requires a request');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select lives_ok($$select public.respond_follow('c1111111-1111-4111-8111-111111111111', 'c3333333-3333-4333-8333-333333333333', false)$$, 'owner can reject');
reset role;
select is((select status::text from social.follows where follower_fursona_id = 'c3333333-3333-4333-8333-333333333333'), 'rejected', 'rejected request stays rejected');
select is((select public from storage.buckets where id = 'fursona-avatars'), false, 'avatar bucket is private');
select is((select public from storage.buckets where id = 'fursona-banners'), false, 'banner bucket is private');
select ok((select qual not like '%can_view_fursona%' from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'profile_media_read'), 'profile media reads do not depend on post access');
select throws_ok($$update core.fursonas set show_reputation = false where username = 'profile_target'$$, '23514', 'new row for relation "fursonas" violates check constraint "fursonas_reputation_visible"', 'reputation cannot be hidden');

select * from finish();
rollback;
