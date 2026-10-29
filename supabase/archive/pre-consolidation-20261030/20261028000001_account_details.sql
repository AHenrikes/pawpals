-- Legal details live in private; the core view is the RLS-protected API surface.
alter table core.accounts alter column updated_at drop not null;
alter table core.accounts alter column updated_at drop default;
alter table private.account_details alter column updated_at drop not null;
alter table private.account_details alter column updated_at drop default;
alter table private.account_details add column age_verified_at timestamptz;

-- Exact timestamp matches have only the insert default; clear those legacy rows
-- before replacing the timestamp triggers.
alter table core.accounts disable trigger accounts_set_updated_at;
alter table private.account_details disable trigger account_details_set_updated_at;
update core.accounts set updated_at = null where updated_at = created_at;
update private.account_details set updated_at = null where updated_at = created_at;

-- The original account creation sets its default fursona in a second statement.
-- That initial assignment is part of creation, not an account edit.
create or replace function core.set_account_updated_at()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if (new.user_id, new.status, new.platform_role, new.default_fursona_id)
     is distinct from (old.user_id, old.status, old.platform_role, old.default_fursona_id) then
    if old.default_fursona_id is null and old.updated_at is null
       and new.default_fursona_id is not null
       and new.status = old.status and new.platform_role = old.platform_role then
      new.updated_at := null;
    else
      new.updated_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger accounts_set_updated_at on core.accounts;
create trigger accounts_set_updated_at before update on core.accounts
for each row execute function core.set_account_updated_at();

create or replace function private.guard_account_details()
returns trigger language plpgsql security definer
set search_path = pg_catalog, core, private as $$
begin
  if old.age_verified_at is not null and
     (new.first_name, new.last_name, new.date_of_birth)
       is distinct from (old.first_name, old.last_name, old.date_of_birth) then
    raise exception 'verified legal details cannot be changed' using errcode = '23514';
  end if;
  if (new.email, new.first_name, new.last_name, new.date_of_birth, new.age_verified_at)
     is distinct from (old.email, old.first_name, old.last_name, old.date_of_birth, old.age_verified_at) then
    new.updated_at := now();
    update core.accounts set updated_at = now() where id = new.account_id;
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

drop trigger account_details_set_updated_at on private.account_details;
create trigger account_details_guard before update on private.account_details
for each row execute function private.guard_account_details();

-- The view remains automatically updatable; column grants prevent changes to
-- email, timestamps, account ownership, and verification state through the API.
create or replace view core.account_private_details with (security_invoker = true) as
select account_id, first_name as firstname, last_name as lastname,
       date_of_birth as dob, email, created_at, updated_at, age_verified_at
from private.account_details;
grant select on core.account_private_details to authenticated;
grant update (firstname, lastname, dob) on core.account_private_details to authenticated;
revoke update (email, first_name, last_name, date_of_birth) on private.account_details from authenticated;
grant update (first_name, last_name, date_of_birth) on private.account_details to authenticated;

create or replace function core.account_can_act(p_account_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, core as $$
  select exists (select 1 from core.accounts
    where id = p_account_id and user_id = auth.uid() and status in ('active', 'at_risk'));
$$;
create or replace function core.owns_fursona(p_fursona_id uuid, p_require_active boolean default true)
returns boolean language sql stable security definer
set search_path = pg_catalog, core as $$
  select exists (
    select 1 from core.fursonas f join core.accounts a on a.id = f.account_id
    where f.id = p_fursona_id and a.user_id = auth.uid()
      and a.status in ('active', 'at_risk')
      and (not p_require_active or f.status = 'active'));
$$;
