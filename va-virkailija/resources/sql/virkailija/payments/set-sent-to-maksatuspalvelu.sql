UPDATE
  payments
SET
  sent_to_maksatuspalvelu_at = now()
WHERE id = :id
AND version = :version
RETURNING id, version;
