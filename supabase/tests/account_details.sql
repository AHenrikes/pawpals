begin;
select plan(12);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'account-test-1@example.test', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'account-test-2@example.test', now(), now());
insert into core.accounts (id, user_id)
values
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111'),
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222');
insert into private.account_details (account_id, email, first_name, last_name, date_of_birth)
values
  ('33333333-3333-4333-8333-333333333333', 'account-test-1@example.test', 'First', 'User', '2000-01-02'),
  ('44444444-4444-4444-8444-444444444444', 'account-test-2@example.test', 'Second', 'User', '2001-01-02');

select is((select updated_at from core.accounts where id = '33333333-3333-4333-8333-333333333333'), null::timestamptz, 'new account has no change timestamp');
select is((select updated_at from private.account_details where account_id = '33333333-3333-4333-8333-333333333333'), null::timestamptz, 'new legal details have no change timestamp');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select lives_ok($$update core.account_private_details set firstname = 'Changed', dob = '1999-05-06' where account_id = '33333333-3333-4333-8333-333333333333'$$, 'owner can edit name and birth date through API view');
select is((select firstname from core.account_private_details where account_id = '33333333-3333-4333-8333-333333333333'), 'Changed', 'owner sees changed details');
select throws_ok($$update core.account_private_details set email = 'wrong@example.test' where account_id = '33333333-3333-4333-8333-333333333333'$$, '42501', 'permission denied for view account_private_details', 'view does not allow email edits');
select is((select count(*) from core.account_private_details where account_id = '44444444-4444-4444-8444-444444444444'), 0::bigint, 'other account details are hidden');
reset role;
select ok((select updated_at is not null from core.accounts where id = '33333333-3333-4333-8333-333333333333'), 'legal detail edit advances account timestamp');
update private.account_details set age_verified_at = now() where account_id = '33333333-3333-4333-8333-333333333333';
set local role authenticated;
select throws_ok($$update core.account_private_details set lastname = 'Changed' where account_id = '33333333-3333-4333-8333-333333333333'$$, '23514', 'verified legal details cannot be changed', 'verified legal details are locked');
select throws_ok($$update core.account_private_details set dob = '1998-05-06' where account_id = '33333333-3333-4333-8333-333333333333'$$, '23514', 'verified legal details cannot be changed', 'verified date of birth is locked');
reset role;
update core.accounts set status = 'at_risk' where id = '33333333-3333-4333-8333-333333333333';
set local role authenticated;
select ok(core.account_can_act('33333333-3333-4333-8333-333333333333'), 'warning status can still act');
select lives_ok($$update core.account_private_details set firstname = firstname where account_id = '33333333-3333-4333-8333-333333333333'$$, 'warning status does not remove API access');
select lives_ok($$select core.create_fursona('Warning test', 'warning_status_test')$$, 'warning status can still create a fursona');

select * from finish();
rollback;
