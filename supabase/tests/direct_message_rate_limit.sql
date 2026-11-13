begin;
select plan(4);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('a8888888-8888-4888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'message-sender@example.test', now(), now()),
  ('a9999999-9999-4999-8999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'message-peer@example.test', now(), now());
insert into core.accounts (id, user_id) values
  ('b8888888-8888-4888-8888-888888888888', 'a8888888-8888-4888-8888-888888888888'),
  ('b9999999-9999-4999-8999-999999999999', 'a9999999-9999-4999-8999-999999999999');
insert into core.fursonas (id, account_id, username, display_name) values
  ('c8888888-8888-4888-8888-888888888888', 'b8888888-8888-4888-8888-888888888888', 'message_sender', 'Sender'),
  ('c9999999-9999-4999-8999-999999999999', 'b9999999-9999-4999-8999-999999999999', 'message_peer', 'Peer');
insert into social.follows (follower_fursona_id, followed_fursona_id, status) values
  ('c8888888-8888-4888-8888-888888888888', 'c9999999-9999-4999-8999-999999999999', 'accepted'),
  ('c9999999-9999-4999-8999-999999999999', 'c8888888-8888-4888-8888-888888888888', 'accepted');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a8888888-8888-4888-8888-888888888888', true);
select lives_ok($$select social.open_conversation('c8888888-8888-4888-8888-888888888888', 'c9999999-9999-4999-8999-999999999999')$$,
  'mutual followers can open a conversation');
select lives_ok($$do $body$ begin
  for i in 1..30 loop
    perform social.send_direct_message('c8888888-8888-4888-8888-888888888888',
      social.open_conversation('c8888888-8888-4888-8888-888888888888',
        'c9999999-9999-4999-8999-999999999999'), 'hello');
  end loop;
end $body$ $$, 'first 30 messages are accepted');
select throws_ok($$select social.send_direct_message('c8888888-8888-4888-8888-888888888888',
  social.open_conversation('c8888888-8888-4888-8888-888888888888',
    'c9999999-9999-4999-8999-999999999999'), 'one more')$$,
  'PT429', null, 'the next message is rate limited');
reset role;
select ok(not has_table_privilege('authenticated', 'private.direct_message_limits', 'SELECT'),
  'quota counters stay private');

select * from finish();
rollback;
