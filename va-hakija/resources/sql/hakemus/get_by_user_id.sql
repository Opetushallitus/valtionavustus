select * from hakemukset where user_key = :user_key AND version_closed IS NULL and status <> 'cancelled'
