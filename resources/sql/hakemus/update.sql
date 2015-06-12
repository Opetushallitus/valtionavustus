UPDATE hakemukset SET (status, submittime) = (:status, now()) WHERE user_key = :user_key
