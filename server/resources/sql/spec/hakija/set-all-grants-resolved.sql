UPDATE hakija.avustushaut SET
    hankkeen_alkamispaiva = '1969-04-20',
    hankkeen_paattymispaiva = '4200-04-20'
WHERE hankkeen_alkamispaiva IS NULL AND hankkeen_paattymispaiva IS NULL;

UPDATE hakija.avustushaut SET status = 'resolved'
