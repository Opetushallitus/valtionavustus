alter table virkailija.payments add column pitkaviite text;
create index payments_pitkaviite on virkailija.payments (pitkaviite);