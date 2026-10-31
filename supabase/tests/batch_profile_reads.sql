begin;
select plan(4);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('a8888888-8888-4888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'batch-owner@example.test', now(), now()),
  ('a9999999-9999-4999-8999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'batch-viewer@example.test', now(), now());
insert into core.accounts (id, user_id) values
  ('b8888888-8888-4888-8888-888888888888', 'a8888888-8888-4888-8888-888888888888'),
  ('b9999999-9999-4999-8999-999999999999', 'a9999999-9999-4999-8999-999999999999');
insert into core.fursonas (id, account_id, username, display_name) values
  ('c8888888-8888-4888-8888-888888888888', 'b8888888-8888-4888-8888-888888888888', 'batch_owner', 'Batch Owner'),
  ('c9999999-9999-4999-8999-999999999999', 'b9999999-9999-4999-8999-999999999999', 'batch_viewer', 'Batch Viewer');

select ok(not has_function_privilege('anon', 'social.get_fursona_profiles_by_ids(uuid[], uuid)', 'EXECUTE'),
  'anonymous users cannot batch-read profiles');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a9999999-9999-4999-8999-999999999999', true);
select is((select count(*) from social.get_fursona_profiles_by_ids(
  array['c8888888-8888-4888-8888-888888888888']::uuid[], 'c9999999-9999-4999-8999-999999999999')),
  1::bigint, 'member can read a profile page in one call');
select is((select count(*) from social.get_fursona_profiles_by_ids(
  array['c8888888-8888-4888-8888-888888888888']::uuid[], 'c8888888-8888-4888-8888-888888888888')),
  0::bigint, 'member cannot claim another acting fursona');
select is((select count(*) from social.get_fursona_profiles_by_ids(
  array_fill('c8888888-8888-4888-8888-888888888888'::uuid, array[21]), null)),
  0::bigint, 'batch reads are limited to one page');
reset role;

select * from finish();
rollback;
