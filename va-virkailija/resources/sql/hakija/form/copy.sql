INSERT INTO forms (content, rules, created_at, updated_at)
  SELECT content, rules, :created_at::timestamptz, :created_at::timestamptz FROM forms WHERE id = :id;
