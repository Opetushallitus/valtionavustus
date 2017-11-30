select
    person_oid,
    first_name,
    surname,
    email,
    content
from va_users_cache
where person_oid = :person_oid;
