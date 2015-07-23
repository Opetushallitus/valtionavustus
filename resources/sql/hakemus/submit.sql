UPDATE hakemukset SET (status, submitted_at) = ('submitted', now()) WHERE user_key = :user_key
