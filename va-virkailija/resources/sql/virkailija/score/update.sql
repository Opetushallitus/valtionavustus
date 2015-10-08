UPDATE scores SET score = :score, modified_at = now()
WHERE arvio_id = :arvio_id and person_oid = :person_oid and selection_criteria_index = :selection_criteria_index
