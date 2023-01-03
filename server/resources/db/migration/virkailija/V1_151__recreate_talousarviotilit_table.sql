DROP TABLE IF EXISTS talousarviotilit;

CREATE TABLE talousarviotilit (
  id      INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code    TEXT NOT NULL,
  year    INTEGER NOT NULL,
  name    TEXT NOT NULL,
  amount  INTEGER NOT NULL,
  UNIQUE (code, year)
);
