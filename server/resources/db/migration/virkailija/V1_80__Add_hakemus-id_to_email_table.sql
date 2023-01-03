DROP TABLE emails;

CREATE TABLE emails (
  id serial PRIMARY KEY,
  user_key varchar(64) NOT NULL,
  hakemus_id integer NOT NULL,
  formatted TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
