ALTER TABLE avustushaut ADD hankkeen_alkamispaiva date;
ALTER TABLE avustushaut ADD hankkeen_paattymispaiva date;

ALTER TABLE avustushaut ADD CONSTRAINT nn_alkamispaiva
    check (hankkeen_alkamispaiva IS NOT NULL OR (status != 'published' AND status != 'resolved')) NOT VALID;

ALTER TABLE avustushaut ADD CONSTRAINT nn_paattymispaiva
    check (hankkeen_paattymispaiva IS NOT NULL OR (status != 'published' AND status != 'resolved')) NOT VALID;
