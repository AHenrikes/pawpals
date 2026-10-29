begin;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values ('a4444444-4444-4444-8444-444444444444',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'search-limits@example.test', now(), now());
insert into core.accounts (id, user_id)
values ('b4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444');
insert into core.fursonas (id, account_id, username, display_name)
values ('c4444444-4444-4444-8444-444444444444',
  'b4444444-4444-4444-8444-444444444444', 'search_target', 'Search Target');

set local role anon;
select throws_ok($$select * from core.search_fursonas('search_target')$$,
  '42501', 'permission denied for function search_fursonas', 'anonymous RPC is unavailable');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a4444444-4444-4444-8444-444444444444', true);
select throws_ok($$select * from core.search_fursonas('ab')$$,
  '22023', 'search term must contain 3 to 50 characters', 'short terms are rejected');
select throws_ok($$select * from core.search_fursonas(repeat('x', 51))$$,
  '22023', 'search term must contain 3 to 50 characters', 'long terms are rejected');
select is((select count(*) from core.search_fursonas('arg')), 1::bigint,
  'three-character substring is found');
select is((select count(*) from core.search_fursonas('%%x')), 0::bigint,
  'percent is treated literally');
select is((select count(*) from core.search_fursonas('___')), 0::bigint,
  'underscore is treated literally');
select lives_ok($$
  do $block$
  begin
    for i in 1..17 loop
      perform count(*) from core.search_fursonas('search_target');
    end loop;
  end
  $block$;
$$, 'twenty searches are allowed in a minute');
select throws_ok($$select * from core.search_fursonas('search_target')$$,
  'PT429', 'profile search rate limit exceeded', 'twenty-first search is limited');
reset role;

select * from finish();
rollback;
