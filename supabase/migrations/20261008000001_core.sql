create extension if not exists pgcrypto with schema extensions;

create schema core;
create schema private;

create type core.account_status as enum ('active', 'suspended', 'closed');
create type core.platform_role as enum ('user', 'admin');
create type core.fursona_status as enum ('active', 'deactivated');
create type core.profile_visibility as enum ('public', 'followers_only', 'private');

create table core.accounts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status core.account_status not null default 'active',
  platform_role core.platform_role not null default 'user',
  default_fursona_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.account_details (
  account_id uuid primary key references core.accounts(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_details_email_valid check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create table core.fursonas (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid not null references core.accounts(id) on delete cascade,
  username text not null,
  display_name text not null,
  bio text,
  species text,
  pronouns text,
  avatar_url TEXT NOT NULL DEFAULT '/images/profile/avatar.png',
  banner_url TEXT NOT NULL DEFAULT '/images/profile/banner.png',
  visibility core.profile_visibility not null default 'public',
  status core.fursona_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fursona_username_format check (username ~ '^[A-Za-z0-9_-]{3,50}$'),
  constraint fursona_display_name_length check (char_length(display_name) between 1 and 100),
  constraint fursona_bio_length check (bio is null or char_length(bio) <= 2000)
);

create unique index fursonas_username_ci_key on core.fursonas (lower(username));
create index fursonas_account_id_idx on core.fursonas (account_id);
create index fursonas_discovery_idx on core.fursonas (status, visibility, created_at desc);

alter table core.accounts
  add constraint accounts_default_fursona_fk
  foreign key (default_fursona_id) references core.fursonas(id) on delete set null
  deferrable initially deferred;

create function core.validate_default_fursona()
returns trigger
language plpgsql
set search_path = pg_catalog, core
as $$
begin
  if new.default_fursona_id is not null and not exists (
    select 1 from core.fursonas
    where id = new.default_fursona_id and account_id = new.id and status = 'active'
  ) then
    raise exception 'default fursona must be an active fursona owned by the account' using errcode = '23514';
  end if;
  return new;
end;
$$;

create constraint trigger accounts_validate_default_fursona
after insert or update of default_fursona_id on core.accounts
deferrable initially deferred
for each row execute function core.validate_default_fursona();

create function core.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger accounts_set_updated_at before update on core.accounts
for each row execute function core.set_updated_at();
create trigger account_details_set_updated_at before update on private.account_details
for each row execute function core.set_updated_at();
create trigger fursonas_set_updated_at before update on core.fursonas
for each row execute function core.set_updated_at();

create function core.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, core
as $$
  select id from core.accounts where user_id = auth.uid();
$$;

create function core.account_can_act(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, core
as $$
  select exists (
    select 1 from core.accounts
    where id = p_account_id and user_id = auth.uid() and status = 'active'
  );
$$;

create function core.owns_fursona(p_fursona_id uuid, p_require_active boolean default true)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, core
as $$
  select exists (
    select 1
    from core.fursonas f
    join core.accounts a on a.id = f.account_id
    where f.id = p_fursona_id
      and a.user_id = auth.uid()
      and a.status = 'active'
      and (not p_require_active or f.status = 'active')
  );
$$;

create function core.create_account(
  p_email text,
  p_display_name text,
  p_username text,
  p_first_name text default null,
  p_last_name text default null,
  p_date_of_birth date default null,
  p_species text default null,
  p_pronouns text default null,
  p_bio text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, core, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_auth_email text;
  v_account_id uuid;
  v_fursona_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select email into v_auth_email from auth.users where id = v_user_id;
  if v_auth_email is null or lower(v_auth_email) <> lower(trim(p_email)) then
    raise exception 'email does not match authenticated user' using errcode = '42501';
  end if;
  select id, default_fursona_id into v_account_id, v_fursona_id
  from core.accounts where user_id = v_user_id;
  if v_account_id is not null then
    return jsonb_build_object('account_id', v_account_id, 'fursona_id', v_fursona_id);
  end if;

  insert into core.accounts (user_id) values (v_user_id) returning id into v_account_id;
  insert into private.account_details (account_id, email, first_name, last_name, date_of_birth)
  values (v_account_id, v_auth_email, p_first_name, p_last_name, p_date_of_birth);
  insert into core.fursonas (account_id, display_name, username, species, pronouns, bio)
  values (v_account_id, p_display_name, p_username, p_species, p_pronouns, p_bio)
  returning id into v_fursona_id;
  update core.accounts set default_fursona_id = v_fursona_id where id = v_account_id;

  return jsonb_build_object('account_id', v_account_id, 'fursona_id', v_fursona_id);
end;
$$;

create function core.create_fursona(
  p_display_name text,
  p_username text,
  p_species text default null,
  p_pronouns text default null,
  p_bio text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, core, extensions
as $$
declare
  v_account core.accounts%rowtype;
  v_id uuid;
begin
  select * into v_account from core.accounts where user_id = auth.uid() for update;
  if not found then raise exception 'account not found' using errcode = 'P0002'; end if;
  if v_account.status <> 'active' then raise exception 'account cannot act' using errcode = '42501'; end if;
  if (select count(*) from core.fursonas where account_id = v_account.id and status = 'active') >= 4 then
    raise exception 'fursona limit reached' using errcode = 'P0001';
  end if;
  insert into core.fursonas (account_id, display_name, username, species, pronouns, bio)
  values (v_account.id, p_display_name, p_username, p_species, p_pronouns, p_bio)
  returning id into v_id;
  if v_account.default_fursona_id is null then
    update core.accounts set default_fursona_id = v_id where id = v_account.id;
  end if;
  return v_id;
end;
$$;

create function core.set_default_fursona(p_fursona_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, core
as $$
declare v_account_id uuid;
begin
  select id into v_account_id from core.accounts where user_id = auth.uid() and status = 'active' for update;
  if v_account_id is null or not exists (
    select 1 from core.fursonas where id = p_fursona_id and account_id = v_account_id and status = 'active'
  ) then raise exception 'not allowed' using errcode = '42501'; end if;
  update core.accounts set default_fursona_id = p_fursona_id where id = v_account_id;
end;
$$;

create view core.account_private_details with (security_invoker = true) as
select account_id, first_name as firstname, last_name as lastname,
       date_of_birth as dob, email, created_at, updated_at
from private.account_details;

alter table core.accounts enable row level security;
alter table private.account_details enable row level security;
alter table core.fursonas enable row level security;

create policy accounts_select_own on core.accounts for select to authenticated
using (user_id = auth.uid());
create policy account_details_select_own on private.account_details for select to authenticated
using (account_id = core.current_account_id());
create policy account_details_update_own on private.account_details for update to authenticated
using (account_id = core.current_account_id()) with check (account_id = core.current_account_id());
create policy fursonas_select_own on core.fursonas for select to authenticated
using (account_id = core.current_account_id());
create policy fursonas_update_own on core.fursonas for update to authenticated
using (account_id = core.current_account_id() and core.account_can_act(account_id))
with check (account_id = core.current_account_id() and core.account_can_act(account_id));

revoke all on schema core, private from public, anon, authenticated;
grant usage on schema core to anon, authenticated;
grant select on core.accounts, core.fursonas to authenticated;
grant select on core.account_private_details to authenticated;
grant update (display_name, username, bio, species, pronouns, avatar_url, banner_url, visibility) on core.fursonas to authenticated;
grant usage on schema private to authenticated;
grant select on private.account_details to authenticated;
grant update (email, first_name, last_name, date_of_birth) on private.account_details to authenticated;

revoke all on all functions in schema core from public, anon, authenticated;
grant execute on function core.current_account_id(), core.account_can_act(uuid), core.owns_fursona(uuid, boolean) to authenticated;
grant execute on function core.create_account(text, text, text, text, text, date, text, text, text) to authenticated;
grant execute on function core.create_fursona(text, text, text, text, text) to authenticated;
grant execute on function core.set_default_fursona(uuid) to authenticated;

comment on table core.fursonas is 'Fursona identity; account ownership is exposed only to the owner.';
comment on column core.fursonas.avatar_url is 'Public profile image URL.';
comment on column core.fursonas.banner_url is 'Public profile banner URL.';
comment on column core.accounts.default_fursona_id is 'Account fallback only; active acting fursona belongs in per-device/session state.';
