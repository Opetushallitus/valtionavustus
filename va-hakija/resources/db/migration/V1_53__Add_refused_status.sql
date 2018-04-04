ALTER TYPE status RENAME TO old_status;
CREATE TYPE status AS ENUM ('new', 'draft', 'submitted', 'pending_change_request', 'cancelled', 'refused');
ALTER TABLE hakemukset ALTER COLUMN status DROP DEFAULT;
ALTER TABLE hakemukset ALTER COLUMN status TYPE status USING status::text::status;
ALTER TABLE hakemukset ALTER COLUMN status SET DEFAULT 'new';
DROP TYPE old_status;
