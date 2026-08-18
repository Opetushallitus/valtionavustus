# Recovery queries

Replace `823`, `2341`, and the cutoff with verified values. Keep the session
read-only.

## Resolve the form ID

```sql
SELECT id AS avustushaku_id,
       form AS hakemus_form_id,
       form_valiselvitys,
       form_loppuselvitys
FROM hakija.avustushaut
WHERE id = 823;
```

If no row is returned, stop and verify the environment and ID. Do not reuse an
ID from QA in production or vice versa.

## Inspect the version timeline

```sql
SET TIME ZONE 'Europe/Helsinki';

SELECT row_number() OVER (ORDER BY archived_at) AS archive_no,
       archived_at,
       jsonb_array_length(content) AS element_count,
       md5(content::text) AS content_md5,
       md5(rules::text) AS rules_md5
FROM hakija.archived_forms
WHERE form_id = 2341
ORDER BY archived_at;

SELECT 'current' AS version,
       updated_at,
       jsonb_array_length(content) AS element_count,
       md5(content::text) AS content_md5,
       md5(rules::text) AS rules_md5
FROM hakija.forms
WHERE id = 2341;
```

## Export the point-in-time JSON

This example recovers the state active immediately before the end-of-day
cutoff for 13.8.2026. The first archive at or after the cutoff contains the
state replaced at that time. When there is no such archive, the current row is
the desired state.

```sql
WITH next_archive AS (
  SELECT af.*
  FROM hakija.archived_forms af
  WHERE af.form_id = 2341
    AND af.archived_at >=
        TIMESTAMPTZ '2026-08-14 00:00:00 Europe/Helsinki'
  ORDER BY af.archived_at
  LIMIT 1
),
chosen AS (
  SELECT af.content,
         af.rules,
         af.created_at,
         COALESCE(
           (SELECT max(previous.archived_at)
            FROM hakija.archived_forms previous
            WHERE previous.form_id = af.form_id
              AND previous.archived_at < af.archived_at),
           af.created_at
         ) AS updated_at
  FROM next_archive af

  UNION ALL

  SELECT f.content, f.rules, f.created_at, f.updated_at
  FROM hakija.forms f
  WHERE f.id = 2341
    AND NOT EXISTS (SELECT 1 FROM next_archive)
)
SELECT jsonb_pretty(
  jsonb_build_object(
    'content', content,
    'rules', rules,
    'created_at', to_char(
      created_at AT TIME ZONE 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    ),
    'updated_at', to_char(
      updated_at AT TIME ZONE 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    )
  )
)
FROM chosen;
```

The resulting object is the format used by the form JSON editor:
`content`, `rules`, `created_at`, and `updated_at`.
