INSERT INTO scores (
  avustushaku_id,
  arvio_id,
  person_oid,
  first_name,
  last_name, 
  email, 
  selection_criteria_index, 
  score
) VALUES (
    :avustushaku_id,
    :arvio_id, 
    :person_oid, 
    :first_name, 
    :last_name, 
    :email, 
    :selection_criteria_index, 
    :score
  )
ON CONFLICT ON CONSTRAINT scores_pkey DO UPDATE SET
  avustushaku_id = EXCLUDED.avustushaku_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name, 
  email = EXCLUDED.email, 
  score = EXCLUDED.score,
  modified_at = now(),
  deleted = FALSE
