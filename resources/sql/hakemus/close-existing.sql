UPDATE hakemukset SET (version_closed) = (now()) WHERE hakemukset.user_key = :user_key AND version_closed IS NULL;
