INSERT INTO email_event (hakemus_id, email_id, email_type, muutoshakemus_id, avustushaku_id, success)
SELECT e.hakemus_id, e.email_id, e.email_type, e.muutoshakemus_id, e.avustushaku_id, true
FROM (
  SELECT DISTINCT ON (email_id) hakemus_id, email_id, email_type, muutoshakemus_id, avustushaku_id, success
  FROM email_event
  ORDER BY email_id, updated_at DESC
) AS e WHERE e.success = false;
