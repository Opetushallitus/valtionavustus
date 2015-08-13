UPDATE hakemukset SET (status, cancelled_at) = ('cancelled', now()) WHERE user_key = :user_key
