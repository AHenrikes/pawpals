update core.fursonas set show_reputation = true where not show_reputation;
alter table core.fursonas add constraint fursonas_reputation_visible check (show_reputation);
