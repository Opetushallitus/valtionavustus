CREATE TABLE virkailija.va_code_values (
  id         SERIAL PRIMARY KEY,
  created_at TIMESTAMP with time zone NOT NULL DEFAULT now(),
  value_type VARCHAR(16),
  year       INTEGER NOT NULL,
  code       VARCHAR(10) NOT NULL,
  code_value TEXT NOT NULL,
  deleted    BOOLEAN
);
