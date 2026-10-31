begin;
select plan(9);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('a3333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'social-owner@example.test', now(), now()),
  ('a4444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'social-viewer@example.test', now(), now());
insert into core.accounts (id, user_id) values
  ('b3333333-3333-4333-8333-333333333333', 'a3333333-3333-4333-8333-333333333333'),
  ('b4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444');
insert into core.fursonas (id, account_id, username, display_name) values
  ('c3333333-3333-4333-8333-333333333333', 'b3333333-3333-4333-8333-333333333333', 'social_owner', 'Social Owner'),
  ('c4444444-4444-4444-8444-444444444444', 'b4444444-4444-4444-8444-444444444444', 'social_viewer', 'Social Viewer');
insert into social.follows (follower_fursona_id, followed_fursona_id, status)
values ('c4444444-4444-4444-8444-444444444444', 'c3333333-3333-4333-8333-333333333333', 'accepted');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a4444444-4444-4444-8444-444444444444', true);
select is((select count(*) from social.follows where followed_fursona_id = 'c3333333-3333-4333-8333-333333333333'),
  1::bigint, 'active member can read accepted follows');
select is((select count(*) from social.get_fursona_stats('c3333333-3333-4333-8333-333333333333')),
  1::bigint, 'active member can read profile stats');
select is((select count(*) from social.v_fursona_stats where fursona_id = 'c4444444-4444-4444-8444-444444444444'),
  1::bigint, 'active member can read own stats view');
reset role;

update core.accounts set status = 'suspended' where id = 'b4444444-4444-4444-8444-444444444444';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a4444444-4444-4444-8444-444444444444', true);
select is((select count(*) from social.follows where followed_fursona_id = 'c3333333-3333-4333-8333-333333333333'),
  0::bigint, 'suspended member cannot read accepted follows directly');
select is((select count(*) from social.get_fursona_stats('c3333333-3333-4333-8333-333333333333')),
  0::bigint, 'suspended member cannot call stats RPC');
select is((select count(*) from social.v_fursona_stats where fursona_id = 'c4444444-4444-4444-8444-444444444444'),
  0::bigint, 'suspended member cannot read stats view');
reset role;

update core.accounts set status = 'at_risk' where id = 'b4444444-4444-4444-8444-444444444444';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a4444444-4444-4444-8444-444444444444', true);
select is((select count(*) from social.follows where followed_fursona_id = 'c3333333-3333-4333-8333-333333333333'),
  1::bigint, 'at-risk member retains follow access');
select is((select count(*) from social.get_fursona_stats('c3333333-3333-4333-8333-333333333333')),
  1::bigint, 'at-risk member retains stats access');
select is((select count(*) from social.v_fursona_stats where fursona_id = 'c4444444-4444-4444-8444-444444444444'),
  1::bigint, 'at-risk member retains stats view access');
reset role;

select * from finish();
rollback;
