begin;
select plan(15);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('a4444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'subscription-owner@example.test', now(), now()),
  ('a5555555-5555-4555-8555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'subscription-viewer@example.test', now(), now());
insert into core.accounts (id, user_id) values
  ('b4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444'),
  ('b5555555-5555-4555-8555-555555555555', 'a5555555-5555-4555-8555-555555555555');
insert into core.fursonas (id, account_id, username, display_name, bio, visibility) values
  ('c4444444-4444-4444-8444-444444444444', 'b4444444-4444-4444-8444-444444444444', 'subscriber_target', 'Target', 'Subscribers can read this', 'subscribers_only'),
  ('c5555555-5555-4555-8555-555555555555', 'b5555555-5555-4555-8555-555555555555', 'subscriber_viewer', 'Viewer', null, 'public');

select throws_ok($$update core.fursonas set visibility = 'followers_only' where username = 'subscriber_target'$$, '23514', null, 'legacy follower-only setting cannot be selected');
select ok(not has_table_privilege('authenticated', 'social.profile_subscriptions', 'SELECT'), 'members cannot inspect entitlements');
select ok(not has_table_privilege('authenticated', 'social.profile_subscriptions', 'INSERT'), 'members cannot grant entitlements');
select ok(not has_table_privilege('anon', 'social.profile_subscriptions', 'SELECT'), 'guests cannot inspect entitlements');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5555555-5555-4555-8555-555555555555', true);
select is((select can_view_content from social.get_fursona_profile_by_identifier('subscriber_target', 'c5555555-5555-4555-8555-555555555555')), false, 'non-subscriber cannot see posts');
select is((select bio from social.get_fursona_profile_by_identifier('subscriber_target', 'c5555555-5555-4555-8555-555555555555')), 'Subscribers can read this', 'non-subscriber can see full profile');
select is(public.request_follow('c5555555-5555-4555-8555-555555555555', 'c4444444-4444-4444-8444-444444444444')::text, 'accepted', 'following subscriber profile is independent of subscription');
select is((select can_view_content from social.get_fursona_profile_by_identifier('subscriber_target', 'c5555555-5555-4555-8555-555555555555')), false, 'following does not unlock subscriber posts');
reset role;

insert into social.profile_subscriptions (subscriber_account_id, target_fursona_id, expires_at)
values ('b5555555-5555-4555-8555-555555555555', 'c4444444-4444-4444-8444-444444444444', now() + interval '1 day');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5555555-5555-4555-8555-555555555555', true);
select is((select bio from social.get_fursona_profile_by_identifier('subscriber_target', 'c5555555-5555-4555-8555-555555555555')), 'Subscribers can read this', 'active subscriber reads content');
select is(social.can_view_fursona(null, 'c4444444-4444-4444-8444-444444444444'), true, 'subscription unlocks posts');
reset role;

update social.profile_subscriptions set expires_at = now() - interval '1 minute', started_at = now() - interval '2 days';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5555555-5555-4555-8555-555555555555', true);
select is((select can_view_content from social.get_fursona_profile_by_identifier('subscriber_target', 'c5555555-5555-4555-8555-555555555555')), false, 'expired entitlement cannot read content');
reset role;

update social.profile_subscriptions set expires_at = now() + interval '1 day', revoked_at = now();
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5555555-5555-4555-8555-555555555555', true);
select is((select can_view_content from social.get_fursona_profile_by_identifier('subscriber_target', 'c5555555-5555-4555-8555-555555555555')), false, 'revoked entitlement cannot read content');
reset role;

set local role anon;
select throws_ok($$select count(*) from core.search_fursonas('subscriber_target')$$, '42501', null, 'anonymous search remains unavailable');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5555555-5555-4555-8555-555555555555', true);
select is((select count(*) from core.search_fursonas('subscriber_target')), 1::bigint, 'subscriber-only profiles remain searchable');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a4444444-4444-4444-8444-444444444444', true);
select is((select can_view_content from social.get_fursona_profile_by_identifier('subscriber_target', 'c4444444-4444-4444-8444-444444444444')), true, 'owner always reads own profile');
reset role;

select * from finish();
rollback;
