DROP TRIGGER update_email_updated_at_timestamp ON emails;
DROP TABLE emails;

CREATE TABLE emails (
  id serial PRIMARY KEY,
  formatted TEXT NOT NULL,

  from_address TEXT NOT NULL,
  sender TEXT NOT NULL,
  to_address jsonb NOT NULL,
  bcc jsonb,
  reply_to TEXT,
  subject TEXT NOT NULL,
  attachment_contents BYTEA,
  attachment_title TEXT,
  attachment_description TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_emails_updated_at_timestamp
BEFORE UPDATE ON emails
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();

CREATE TYPE email_type AS ENUM ('paatos-refuse', 'notify-valmistelija-of-new-muutoshakemus');

CREATE TABLE email_event (
  id serial PRIMARY KEY,

  hakemus_id integer NOT NULL,
  email_id  integer NOT NULL,
  email_type email_type NOT NULL,

  success boolean NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (hakemus_id) REFERENCES hakemus (id),
  FOREIGN KEY (email_id) REFERENCES emails (id)
);

CREATE TRIGGER update_email_event_updated_at_timestamp
BEFORE UPDATE ON email_event
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();

