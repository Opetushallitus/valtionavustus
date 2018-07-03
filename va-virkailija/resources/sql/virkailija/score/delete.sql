UPDATE
  scores
SET
  modified_at = now(),
  deleted = true
WHERE
  arvio_id = :arvio_id AND
  person_oid = :person_oid AND
  deleted IS NOT TRUE AND
  selection_criteria_index = :selection_criteria_index
