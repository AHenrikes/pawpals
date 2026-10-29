begin;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('55555555-5555-4555-8555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'original@example.test', now(), now()),
  ('66666666-6666-4666-8666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other@example.test', now(), now());
insert into core.accounts (id, user_id)
values ('77777777-7777-4777-8777-777777777777', '55555555-5555-4555-8555-555555555555');
insert into private.account_details (account_id, email)
values ('77777777-7777-4777-8777-777777777777', 'original@example.test');

update auth.users set email_change = 'pending@example.test', phone_change = '+358401234567'
where id = '55555555-5555-4555-8555-555555555555';
select is((select email from private.account_details where account_id = '77777777-7777-4777-8777-777777777777'), 'original@example.test', 'pending email is not saved');
select is((select phone_number from private.account_details where account_id = '77777777-7777-4777-8777-777777777777'), null::text, 'pending phone is not saved');
select throws_ok($$update auth.users set phone_change = '+358401234567' where id = '66666666-6666-4666-8666-666666666666'$$, '23505', 'phone number already has a pending verification', 'pending phone belongs to only one account');

update auth.users set email = 'confirmed@example.test', phone = '+358401234567', phone_confirmed_at = now()
where id = '55555555-5555-4555-8555-555555555555';
select is((select email from private.account_details where account_id = '77777777-7777-4777-8777-777777777777'), 'confirmed@example.test', 'confirmed email is saved');
select is((select phone_number from private.account_details where account_id = '77777777-7777-4777-8777-777777777777'), '+358401234567', 'confirmed phone is saved');
select ok((select updated_at is not null from core.accounts where id = '77777777-7777-4777-8777-777777777777'), 'verified contact change advances account timestamp');

set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select throws_ok($$update core.account_private_details set email = 'unverified@example.test' where account_id = '77777777-7777-4777-8777-777777777777'$$, '42501', 'permission denied for view account_private_details', 'API view cannot bypass email confirmation');
select throws_ok($$update core.account_private_details set phone_number = '+358409999999' where account_id = '77777777-7777-4777-8777-777777777777'$$, '42501', 'permission denied for view account_private_details', 'API view cannot bypass phone confirmation');

select * from finish();
rollback;
