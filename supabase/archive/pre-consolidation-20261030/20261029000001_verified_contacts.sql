-- Auth is the source of truth for verified contact methods. The private copy
-- follows only completed Auth changes, never pending email/phone requests.
alter table private.account_details add column phone_number text;

create or replace function private.guard_account_details()
returns trigger language plpgsql security definer
set search_path = pg_catalog, core, private as $$
begin
  if old.age_verified_at is not null and
     (new.first_name, new.last_name, new.date_of_birth)
       is distinct from (old.first_name, old.last_name, old.date_of_birth) then
    raise exception 'verified legal details cannot be changed' using errcode = '23514';
  end if;
  if (new.email, new.phone_number, new.first_name, new.last_name,
      new.date_of_birth, new.age_verified_at)
     is distinct from (old.email, old.phone_number, old.first_name,
                       old.last_name, old.date_of_birth, old.age_verified_at) then
    new.updated_at := now();
    update core.accounts set updated_at = now() where id = new.account_id;
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

create or replace view core.account_private_details with (security_invoker = true) as
select account_id, first_name as firstname, last_name as lastname,
       date_of_birth as dob, email, created_at, updated_at, age_verified_at,
       phone_number
from private.account_details;
grant select on core.account_private_details to authenticated;

create function private.sync_verified_contacts()
returns trigger language plpgsql security definer
set search_path = pg_catalog, core, private as $$
begin
  update private.account_details details
  set email = new.email,
      phone_number = case when new.phone_confirmed_at is not null
        then nullif(new.phone, '') else null end
  from core.accounts account
  where account.id = details.account_id
    and account.user_id = new.id
    and (details.email, details.phone_number) is distinct from
        (new.email, case when new.phone_confirmed_at is not null
          then nullif(new.phone, '') else null end);
  return new;
end;
$$;

create trigger auth_user_verified_contacts
after update of email, phone, phone_confirmed_at on auth.users
for each row execute function private.sync_verified_contacts();

update private.account_details details
set phone_number = auth.phone
from core.accounts account join auth.users auth on auth.id = account.user_id
where account.id = details.account_id
  and auth.phone_confirmed_at is not null
  and nullif(auth.phone, '') is not null
  and details.phone_number is distinct from auth.phone;

-- GoTrue looks up phone-change OTPs by pending number. Serialize requests for
-- the same number and reject a second pending owner before an OTP can be sent.
create function private.check_unique_pending_phone()
returns trigger language plpgsql security definer
set search_path = pg_catalog, auth as $$
begin
  if new.phone_change is null or new.phone_change = '' then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.phone_change, 0));
  if exists (select 1 from auth.users
             where phone_change = new.phone_change and id <> new.id) then
    raise exception 'phone number already has a pending verification'
      using errcode = '23505';
  end if;
  return new;
end;
$$;
create trigger auth_user_pending_phone_unique
before insert or update of phone_change on auth.users
for each row execute function private.check_unique_pending_phone();
