-- Username lifecycle, profile search/counts, and atomic profile deletion.
alter table core.fursonas add column last_username_change_at timestamptz;

create table core.username_history (
  id uuid primary key default extensions.gen_random_uuid(),
  fursona_id uuid not null references core.fursonas(id) on delete cascade,
  old_username text not null,
  new_username text not null,
  changed_at timestamptz not null default now(),
  reason text not null default 'user_change'
);
create index username_history_fursona_changed_idx
  on core.username_history (fursona_id, changed_at desc);

create function core.check_username_availability(p_username text)
returns boolean language sql stable security definer
set search_path = pg_catalog, core
as $$
  select p_username ~ '^[A-Za-z0-9_-]{3,50}$'
    and not exists (select 1 from core.fursonas where lower(username) = lower(p_username));
$$;

create function core.check_username_cooldown(p_fursona_id uuid)
returns timestamptz language sql stable security definer
set search_path = pg_catalog, core
as $$
  select case
    when last_username_change_at + interval '30 days' > now()
      then last_username_change_at + interval '30 days'
    else null
  end
  from core.fursonas
  where id = p_fursona_id and core.owns_fursona(id, false);
$$;

create function core.change_username(p_fursona_id uuid, p_new_username text, p_account_id uuid)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, core
as $$
declare
  v_fursona core.fursonas%rowtype;
  v_username text := lower(trim(p_new_username));
  v_changed_at timestamptz := now();
begin
  if p_account_id is distinct from core.current_account_id() or not core.account_can_act(p_account_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into v_fursona from core.fursonas
  where id = p_fursona_id and account_id = p_account_id and status = 'active'
  for update;
  if not found then raise exception 'fursona not found' using errcode = 'P0002'; end if;
  if v_username !~ '^[a-z0-9_-]{3,50}$' then raise exception 'invalid username' using errcode = '23514'; end if;
  if lower(v_fursona.username) = v_username then raise exception 'username is unchanged' using errcode = '23514'; end if;
  if v_fursona.last_username_change_at is not null
     and v_fursona.last_username_change_at + interval '30 days' > v_changed_at then
    raise exception 'username change is on cooldown' using errcode = 'P0001';
  end if;
  update core.fursonas set username = v_username, last_username_change_at = v_changed_at
  where id = p_fursona_id;
  insert into core.username_history (fursona_id, old_username, new_username, changed_at)
  values (p_fursona_id, v_fursona.username, v_username, v_changed_at);
  return jsonb_build_object(
    'success', true,
    'old_username', v_fursona.username,
    'new_username', v_username,
    'changed_at', v_changed_at,
    'cooldown_until', v_changed_at + interval '30 days'
  );
exception when unique_violation then
  raise exception 'username is already taken' using errcode = '23505';
end;
$$;

create function core.search_fursonas(search_term text)
returns table (id uuid, username text, display_name text, avatar_url text, species text)
language sql stable security definer
set search_path = pg_catalog, core
as $$
  select f.id, f.username, f.display_name, f.avatar_url, f.species
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  where a.status = 'active' and f.status = 'active' and f.visibility = 'public'
    and (f.username ilike '%' || trim(search_term) || '%'
      or f.display_name ilike '%' || trim(search_term) || '%')
  order by case when lower(f.username) = lower(trim(search_term)) then 0 else 1 end, f.username
  limit 25;
$$;

create function core.delete_fursona(p_fursona_id uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, core
as $$
declare
  v_account core.accounts%rowtype;
  v_next_default uuid;
begin
  select a.* into v_account
  from core.accounts a join core.fursonas f on f.account_id = a.id
  where a.user_id = auth.uid() and f.id = p_fursona_id
  for update of a;
  if not found or v_account.status <> 'active' then raise exception 'fursona not found' using errcode = 'P0002'; end if;
  if (select count(*) from core.fursonas where account_id = v_account.id and status = 'active') <= 1 then
    raise exception 'cannot delete last fursona' using errcode = '23514';
  end if;
  if v_account.default_fursona_id = p_fursona_id then
    select id into v_next_default from core.fursonas
    where account_id = v_account.id and id <> p_fursona_id and status = 'active'
    order by created_at limit 1;
    update core.accounts set default_fursona_id = v_next_default where id = v_account.id;
  end if;
  delete from core.fursonas where id = p_fursona_id and account_id = v_account.id;
end;
$$;

create view social.v_fursona_stats with (security_invoker = on) as
select
  f.id as fursona_id,
  0::integer as reputation,
  0::integer as post_count,
  (select count(*) from social.follows where followed_fursona_id = f.id and status = 'accepted')::integer as follower_count,
  (select count(*) from social.follows where follower_fursona_id = f.id and status = 'accepted')::integer as following_count,
  0::integer as like_count
from core.fursonas f
join core.accounts a on a.id = f.account_id
where f.status = 'active' and a.status = 'active';

alter table core.username_history enable row level security;
create policy username_history_owner_read on core.username_history for select to authenticated
using (core.owns_fursona(fursona_id, false));
grant select on core.username_history to authenticated;
grant select on social.v_fursona_stats to authenticated;
revoke update (username) on core.fursonas from authenticated;

revoke all on function core.check_username_availability(text) from public, anon, authenticated;
revoke all on function core.check_username_cooldown(uuid) from public, anon, authenticated;
revoke all on function core.change_username(uuid, text, uuid) from public, anon, authenticated;
revoke all on function core.search_fursonas(text) from public, anon, authenticated;
revoke all on function core.delete_fursona(uuid) from public, anon, authenticated;
grant execute on function core.check_username_availability(text) to anon, authenticated;
grant execute on function core.check_username_cooldown(uuid) to authenticated;
grant execute on function core.change_username(uuid, text, uuid) to authenticated;
grant execute on function core.search_fursonas(text) to anon, authenticated;
grant execute on function core.delete_fursona(uuid) to authenticated;

create function public.check_username_availability(p_username text)
returns boolean language sql stable security invoker set search_path = pg_catalog
as $$ select core.check_username_availability(p_username); $$;
create function public.check_username_cooldown(p_fursona_id uuid)
returns timestamptz language sql stable security invoker set search_path = pg_catalog
as $$ select core.check_username_cooldown(p_fursona_id); $$;
create function public.change_username(p_fursona_id uuid, p_new_username text, p_account_id uuid)
returns jsonb language sql security invoker set search_path = pg_catalog
as $$ select core.change_username(p_fursona_id, p_new_username, p_account_id); $$;
create function public.delete_fursona(p_fursona_id uuid)
returns void language sql security invoker set search_path = pg_catalog
as $$ select core.delete_fursona(p_fursona_id); $$;

revoke all on function public.check_username_availability(text) from public, anon, authenticated;
revoke all on function public.check_username_cooldown(uuid) from public, anon, authenticated;
revoke all on function public.change_username(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.delete_fursona(uuid) from public, anon, authenticated;
grant execute on function public.check_username_availability(text) to anon, authenticated;
grant execute on function public.check_username_cooldown(uuid) to authenticated;
grant execute on function public.change_username(uuid, text, uuid) to authenticated;
grant execute on function public.delete_fursona(uuid) to authenticated;
