CREATE TYPE haku_status AS ENUM ('new', 'draft', 'published');
ALTER TABLE avustushaut ADD COLUMN status haku_status DEFAULT 'new' NOT NULL;
UPDATE avustushaut SET status = 'published' WHERE ID = 1;
CREATE INDEX ON avustushaut(status);
