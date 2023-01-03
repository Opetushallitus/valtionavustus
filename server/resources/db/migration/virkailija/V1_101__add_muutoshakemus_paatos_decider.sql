alter table virkailija.paatos
add column decider text;

update virkailija.paatos set decider = 'Testi Testinen';

alter table virkailija.paatos
alter column decider set not null;
