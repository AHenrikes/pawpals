-- Adding an enum value and using it must happen in separate migration transactions.
alter type core.profile_visibility add value if not exists 'subscribers_only';
