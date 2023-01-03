ALTER TABLE
  hakija.hakemukset
ADD COLUMN
  refused BOOLEAN,
ADD COLUMN
  refused_comment TEXT,
ADD COLUMN
  refused_at TIMESTAMP WITH TIME ZONE
