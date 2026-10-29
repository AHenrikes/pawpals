-- Keep new profile image uploads within the application's 5 MiB limit.
update storage.buckets
set file_size_limit = 5242880
where id in ('fursona-avatars', 'fursona-banners');
