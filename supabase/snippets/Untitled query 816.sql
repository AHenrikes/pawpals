drop function if exists get_or_create_dm(uuid);
drop function if exists get_or_create_dm(uuid, uuid);
drop function if exists get_user_conversations();
drop table if exists messages cascade;
drop table if exists conversation_participants cascade;
drop table if exists conversations cascade;