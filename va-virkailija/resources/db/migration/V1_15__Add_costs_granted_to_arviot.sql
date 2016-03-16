alter table arviot add costs_granted integer not null default 0;
alter table arviot add use_overridden_detailed_costs boolean default false;
update arviot
set use_overridden_detailed_costs = true;