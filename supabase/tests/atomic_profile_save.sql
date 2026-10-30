begin;
select plan(7);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values ('a5555555-5555-4555-8555-555555555555',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'atomic-profile@example.test', now(), now());
insert into core.accounts (id, user_id)
values ('b5555555-5555-4555-8555-555555555555', 'a5555555-5555-4555-8555-555555555555');
insert into core.fursonas (id, account_id, username, display_name)
values ('c5555555-5555-4555-8555-555555555555',
  'b5555555-5555-4555-8555-555555555555', 'atomic_before', 'Before');
insert into core.fursonas (id, account_id, username, display_name)
values ('c5555555-5555-4555-8555-555555555556',
  'b5555555-5555-4555-8555-555555555555', 'rollback_before', 'Rollback');

select ok(not has_function_privilege('anon', 'public.save_fursona_profile(uuid, uuid, jsonb, text)', 'EXECUTE'),
  'guests cannot save profiles');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5555555-5555-4555-8555-555555555555', true);
select lives_ok($$select public.save_fursona_profile(
  'c5555555-5555-4555-8555-555555555555',
  'b5555555-5555-4555-8555-555555555555',
  '{"display_name":"After","bio":"Updated"}'::jsonb, 'atomic_after')$$,
  'profile fields and username can be saved together');
select is((select username from core.fursonas where id = 'c5555555-5555-4555-8555-555555555555'),
  'atomic_after', 'username changed');
select is((select bio from core.fursonas where id = 'c5555555-5555-4555-8555-555555555555'),
  'Updated', 'profile field changed');

select lives_ok($$do $test$ begin
  begin
    perform public.save_fursona_profile(
      'c5555555-5555-4555-8555-555555555556',
      'b5555555-5555-4555-8555-555555555555',
      '{"display_name":""}'::jsonb, 'rollback_after');
    raise exception 'invalid update unexpectedly succeeded';
  exception when check_violation then null;
  end;
end $test$;$$, 'invalid profile fields are rejected');
select is((select display_name from core.fursonas where id = 'c5555555-5555-4555-8555-555555555555'),
  'After', 'failed save leaves the profile unchanged');
select is((select username from core.fursonas where id = 'c5555555-5555-4555-8555-555555555556'),
  'rollback_before', 'failed field update also rolls back the username change');

select * from finish();
rollback;
