alter table core.fursonas
  drop constraint fursonas_profile_theme_check;

alter table core.fursonas
  add constraint fursonas_profile_theme_check
  check (profile_theme in ('light', 'dark', 'app'));
