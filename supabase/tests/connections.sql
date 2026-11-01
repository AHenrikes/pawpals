begin;
select plan(12);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('a6666666-6666-4666-8666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'connections-owner@example.test', now(), now()),
  ('a7777777-7777-4777-8777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'connections-member@example.test', now(), now());
insert into core.accounts (id, user_id, default_fursona_id) values
  ('b6666666-6666-4666-8666-666666666666', 'a6666666-6666-4666-8666-666666666666', null),
  ('b7777777-7777-4777-8777-777777777777', 'a7777777-7777-4777-8777-777777777777', null);
insert into core.fursonas (id, account_id, username, display_name) values
  ('c6666666-6666-4666-8666-666666666666', 'b6666666-6666-4666-8666-666666666666', 'connections_owner', 'Owner'),
  ('c7777777-7777-4777-8777-777777777777', 'b7777777-7777-4777-8777-777777777777', 'connections_member', 'Member');
update core.accounts set default_fursona_id = 'c6666666-6666-4666-8666-666666666666'
  where id = 'b6666666-6666-4666-8666-666666666666';
update core.accounts set default_fursona_id = 'c7777777-7777-4777-8777-777777777777'
  where id = 'b7777777-7777-4777-8777-777777777777';
insert into social.follows (follower_fursona_id, followed_fursona_id, status)
values ('c7777777-7777-4777-8777-777777777777', 'c6666666-6666-4666-8666-666666666666', 'accepted');
insert into social.profile_subscriptions (subscriber_account_id, target_fursona_id, expires_at)
values ('b7777777-7777-4777-8777-777777777777', 'c6666666-6666-4666-8666-666666666666', now() + interval '1 day');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a7777777-7777-4777-8777-777777777777', true);
select throws_ok($$select * from social.list_profile_subscriptions('c6666666-6666-4666-8666-666666666666', 'subscribers', 'newest', 20, 0)$$,
  '42501', null, 'another member cannot list subscribers');
select throws_ok($$select social.remove_follower('c6666666-6666-4666-8666-666666666666', 'c7777777-7777-4777-8777-777777777777')$$,
  '42501', null, 'another member cannot remove followers');
select is((select count(*) from social.list_profile_subscriptions('c7777777-7777-4777-8777-777777777777', 'subscribed', 'newest', 20, 0)),
  1::bigint, 'subscriber can see own subscription');
select is((select count(*) from social.search_profile_connections('c6666666-6666-4666-8666-666666666666', 'followers', 'member', 'newest', 20, 0)),
  1::bigint, 'member can search accepted followers');
select throws_ok($$select * from social.search_profile_connections('c6666666-6666-4666-8666-666666666666', 'subscribers', 'member', 'newest', 20, 0)$$,
  '42501', null, 'another member cannot search subscribers');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a6666666-6666-4666-8666-666666666666', true);
select is((select fursona_id from social.list_profile_subscriptions('c6666666-6666-4666-8666-666666666666', 'subscribers', 'newest', 20, 0)),
  'c7777777-7777-4777-8777-777777777777'::uuid, 'owner sees subscriber profile');
select is((select count(*) from social.search_profile_connections('c6666666-6666-4666-8666-666666666666', 'subscribers', 'member', 'newest', 20, 0)),
  1::bigint, 'owner can search subscribers');
select throws_ok($$select * from social.list_profile_subscriptions('c6666666-6666-4666-8666-666666666666', 'subscribers', 'newest', 21, 0)$$,
  '22023', null, 'subscription list page size is bounded');
select lives_ok($$select social.remove_follower('c6666666-6666-4666-8666-666666666666', 'c7777777-7777-4777-8777-777777777777')$$,
  'owner can remove follower');
select is((select count(*) from social.follows where followed_fursona_id = 'c6666666-6666-4666-8666-666666666666'),
  0::bigint, 'follower relationship is gone');
reset role;

update social.profile_subscriptions set revoked_at = now();
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a6666666-6666-4666-8666-666666666666', true);
select is((select count(*) from social.list_profile_subscriptions('c6666666-6666-4666-8666-666666666666', 'subscribers', 'newest', 20, 0)),
  0::bigint, 'revoked subscribers are hidden');
reset role;
select ok(not has_table_privilege('authenticated', 'social.profile_subscriptions', 'SELECT'), 'entitlement table stays private');

select * from finish();
rollback;
