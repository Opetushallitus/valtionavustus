DROP TRIGGER update_email_event_updated_at_timestamp ON email_event;
DROP TABLE email_event;
DROP TYPE email_type;

CREATE DOMAIN validated_email AS text
  CHECK ( value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$' );

ALTER TABLE normalized_hakemus ALTER COLUMN contact_email TYPE validated_email;

DROP DOMAIN email;

DROP TRIGGER update_emails_updated_at_timestamp ON emails;
DROP TABLE emails;

CREATE TABLE email (
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

CREATE TRIGGER update_email_updated_at_timestamp
BEFORE UPDATE ON email
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();

CREATE TYPE email_type AS ENUM (
  'new-hakemus',
  'hakemus-submitted',
  'hakemus-submitted-after-change-request',
  'hakemus-change-request-responded',
  'notify-valmistelija-of-new-muutoshakemus',
  'application-refused-presenter',
  'application-refused',
  'hakemus-edited-after-applicant-edit',
  'change-request',
  'paatos',
  'paatos-refuse',
  'selvitys',
  'valiselvitys-notification',
  'loppuselvitys-notification',
  'payments-info-notification'
  );

CREATE TABLE email_event (
  id serial PRIMARY KEY,

  hakemus_id integer,
  email_id  integer NOT NULL,
  email_type email_type NOT NULL,

  success boolean NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (hakemus_id) REFERENCES hakemus (id),
  FOREIGN KEY (email_id) REFERENCES email (id)
);

CREATE TRIGGER update_email_event_updated_at_timestamp
BEFORE UPDATE ON email_event
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();

