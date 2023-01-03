insert into va_users_cache (person_oid, first_name, surname, email, content)
select :person_oid, :first_name, :surname, :email, :content
where not exists (select id from va_users_cache where person_oid = :person_oid);
