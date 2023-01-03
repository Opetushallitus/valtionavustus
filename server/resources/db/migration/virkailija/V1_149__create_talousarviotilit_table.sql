CREATE TABLE talousarviotilit (
  id      SERIAL PRIMARY KEY,
  code    TEXT UNIQUE NOT NULL,
  year    INTEGER NOT NULL,
  name    TEXT NOT NULL,
  amount  INTEGER NOT NULL
);
