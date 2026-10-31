begin;
select plan(6);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('a1111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'read-owner@example.test', now(), now()),
  ('a2222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'read-viewer@example.test', now(), now());
insert into core.accounts (id, user_id) values
  ('b1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111'),
  ('b2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222');
insert into core.fursonas (id, account_id, username, display_name, avatar_url)
values ('c1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111',
  'read_owner', 'Read Owner', '/api/media/fursona-avatars/c1111111-1111-4111-8111-111111111111/current.png');
insert into storage.objects (bucket_id, name)
values ('fursona-avatars', 'c1111111-1111-4111-8111-111111111111/current.png');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select is((select count(*) from social.get_fursona_profile('c1111111-1111-4111-8111-111111111111')),
  1::bigint, 'active member can read a profile');
reset role;

update core.accounts set status = 'suspended' where id = 'b2222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select is((select count(*) from social.get_fursona_profile('c1111111-1111-4111-8111-111111111111')),
  0::bigint, 'suspended member cannot read a profile by id');
select is((select count(*) from social.get_fursona_profile_by_identifier('read_owner')),
  0::bigint, 'suspended member cannot read a profile by identifier');
select is((select count(*) from social.get_fursona_profiles_by_ids(
  array['c1111111-1111-4111-8111-111111111111']::uuid[])),
  0::bigint, 'suspended member cannot batch-read profiles');
select is((select count(*) from storage.objects where name = 'c1111111-1111-4111-8111-111111111111/current.png'),
  0::bigint, 'suspended member cannot read profile media');
reset role;

update core.accounts set status = 'at_risk' where id = 'b2222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select is((select count(*) from social.get_fursona_profile('c1111111-1111-4111-8111-111111111111')),
  1::bigint, 'at-risk member retains normal profile access');
reset role;

select * from finish();
rollback;
