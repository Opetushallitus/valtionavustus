SELECT
  *
FROM
  hakemukset
WHERE
  user_key = :user_key AND
  version = :version AND
  status <> 'cancelled'
LIMIT 1
