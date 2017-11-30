update va_users_cache
set
  first_name = :first_name,
  surname = :surname,
  email = :email,
  content = :content,
  updated_at = now()
where person_oid = :person_oid;
