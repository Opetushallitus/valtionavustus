UPDATE
  scores
SET
  score = :score, modified_at = now(), deleted = FALSE
WHERE
  arvio_id = :arvio_id AND
  person_oid = :person_oid AND
  selection_criteria_index = :selection_criteria_index
