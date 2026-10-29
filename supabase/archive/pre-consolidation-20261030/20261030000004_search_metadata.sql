-- Keep identity searchable without exposing gated profile fields.
create or replace function core.search_fursonas(search_term text)
returns table (id uuid, username text, display_name text, avatar_url text, species text)
language sql stable security definer set search_path = pg_catalog, core as $$
  select f.id, f.username, f.display_name,
    case when f.visibility = 'public' then f.avatar_url else null end,
    case when f.visibility = 'public' then f.species else null end
  from core.fursonas f join core.accounts a on a.id = f.account_id
  where a.status in ('active', 'at_risk') and f.status = 'active'
    and (f.username ilike '%' || trim(search_term) || '%'
      or f.display_name ilike '%' || trim(search_term) || '%')
  order by case when lower(f.username) = lower(trim(search_term)) then 0 else 1 end, f.username
  limit 25;
$$;
