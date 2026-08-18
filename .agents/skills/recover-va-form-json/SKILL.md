---
name: recover-va-form-json
description: Use when a Valtionavustus form was lost, overwritten, or deleted and its JSON must be recovered from QA or production as it existed at a requested date or time.
---

# Recover VA Form JSON

## Overview

Recover an editor-compatible VA form definition from `hakija.forms` and
`hakija.archived_forms`. Export and verify the JSON; never restore it to a
remote database unless the user separately and explicitly requests that
write operation.

## Required inputs

Obtain:

- the avustushaku ID or form-editor URL;
- the target environment;
- the requested date/time and year;
- the form type: hakemus, valiselvitys, or loppuselvitys;
- the output path.

Map `testi.virkailija...` to `qa` and `virkailija...` to `prod`. Treat IDs as
environment-local. Do not search another environment with the same ID. Ask
when the URL and stated environment conflict.

## Workflow

1. Inspect `server/src/clojure/oph/soresu/form/db.clj` and the relevant
   migrations if the schema may have changed.
2. Use `scripts/psql/psql-va-{qa|prod}.sh`. Run only read-only SQL: `SELECT`
   statements and session settings.
3. Resolve the form ID from `hakija.avustushaut`: `form` for hakemus,
   `form_valiselvitys` for valiselvitys, or `form_loppuselvitys` for
   loppuselvitys.
4. List `hakija.archived_forms` timestamps in `Europe/Helsinki` before
   selecting a version. Read [queries.md](references/queries.md) and use its
   metadata query.
5. Interpret an end-of-day request as midnight at the start of the following
   day in `Europe/Helsinki`.
6. Select the earliest archive row whose `archived_at` is at or after the
   requested cutoff. An archive row contains the state that was replaced at
   `archived_at`, so this is the state active at the requested instant. If no
   later archive exists, use the current `hakija.forms` row.
7. Export `content`, `rules`, `created_at`, and `updated_at` using the point-in-
   time query in [queries.md](references/queries.md). For an archived state,
   derive `updated_at` from the preceding `archived_at`, falling back to
   `created_at` for the initial state.
8. Save the output outside tracked source by default. Never include database
   credentials or application answers.
9. Validate with `jq -e . <file>` and compare the parsed JSON semantically
   against the selected database row. Report the form ID, effective update
   time, archive replacement time, output path, and SHA-256 checksum.

## Guardrails

- Do not use `version_closed`; it versions applications and submissions, not
  form definitions.
- Do not assume the newest archive is the requested version.
- Do not mistake `archived_at` for the time the archived content was created.
- Do not update `forms`, `archived_forms`, or `avustushaut` during recovery.
- Do not commit recovered business JSON unless the user explicitly requests
  it.

## Example

For “as it was at the end of 13.8.2026,” use the cutoff
`2026-08-14 00:00:00 Europe/Helsinki`. If the first later archive is dated
18.8., export that archive row: it is the state that remained active from the
last 13.8. save until it was replaced on 18.8.
