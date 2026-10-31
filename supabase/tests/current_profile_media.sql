begin;
select plan(4);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('a6666666-6666-4666-8666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'media-owner@example.test', now(), now()),
  ('a7777777-7777-4777-8777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'media-viewer@example.test', now(), now());
insert into core.accounts (id, user_id) values
  ('b6666666-6666-4666-8666-666666666666', 'a6666666-6666-4666-8666-666666666666'),
  ('b7777777-7777-4777-8777-777777777777', 'a7777777-7777-4777-8777-777777777777');
insert into core.fursonas (id, account_id, username, display_name, avatar_url)
values ('c6666666-6666-4666-8666-666666666666', 'b6666666-6666-4666-8666-666666666666',
  'media_owner', 'Media Owner', '/api/media/fursona-avatars/c6666666-6666-4666-8666-666666666666/current.png');
insert into storage.objects (bucket_id, name) values
  ('fursona-avatars', 'c6666666-6666-4666-8666-666666666666/current.png'),
  ('fursona-avatars', 'c6666666-6666-4666-8666-666666666666/old.png');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a7777777-7777-4777-8777-777777777777', true);
select is((select count(*) from storage.objects where name like 'c6666666-6666-4666-8666-666666666666/%'),
  1::bigint, 'another member sees only the current image');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a6666666-6666-4666-8666-666666666666', true);
select is((select count(*) from storage.objects where name like 'c6666666-6666-4666-8666-666666666666/%'),
  2::bigint, 'owner can still read and remove old uploads');
reset role;

update core.fursonas set avatar_url = '/api/media/fursona-avatars/c6666666-6666-4666-8666-666666666666/old.png'
where id = 'c6666666-6666-4666-8666-666666666666';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a7777777-7777-4777-8777-777777777777', true);
select is((select name from storage.objects where name like 'c6666666-6666-4666-8666-666666666666/%'),
  'c6666666-6666-4666-8666-666666666666/old.png', 'access follows the current profile reference');
reset role;

set local role anon;
select is((select count(*) from storage.objects where name like 'c6666666-6666-4666-8666-666666666666/%'),
  0::bigint, 'anonymous users cannot read profile images');
reset role;

select * from finish();
rollback;
