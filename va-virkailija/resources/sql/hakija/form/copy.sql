INSERT INTO forms (content, rules)
  SELECT content, rules FROM forms WHERE id = :id;
