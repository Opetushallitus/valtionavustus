ALTER
  TABLE arviot
ADD
  COLUMN allow_visibility_in_external_system BOOLEAN NOT NULL DEFAULT FALSE;
