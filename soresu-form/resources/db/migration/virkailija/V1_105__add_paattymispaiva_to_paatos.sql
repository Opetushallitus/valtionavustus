ALTER TABLE virkailija.paatos ADD COLUMN paattymispaiva date;
ALTER TABLE virkailija.paatos ADD CONSTRAINT paattymispaiva_check CHECK ( status != 'accepted_with_changes' OR paattymispaiva is not null );
