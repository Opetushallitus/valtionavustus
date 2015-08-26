ALTER TABLE forms ADD rules jsonb NOT NULL DEFAULT '[]';
ALTER TABLE archived_forms ADD rules jsonb NOT NULL DEFAULT '[]';

INSERT INTO archived_forms (form_id, created_at, content)
    SELECT id, created_at, content FROM forms WHERE id = 1;

UPDATE forms set rules = '
[
  {
    "type": "includeIf",
    "triggeringId": "combined-effort",
    "targetIds": ["other-organizations"],
    "params": {
      "triggeringValue": "yes"
    }
  }
]
' WHERE id = 1;