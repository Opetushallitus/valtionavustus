CREATE TABLE emails (
  id serial PRIMARY KEY,
  avustushaku_id integer NOT NULL,
  formatted TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
