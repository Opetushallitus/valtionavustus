UPDATE hakemukset SET (verified_at) = (now()) WHERE user_key = :user_key AND verify_key = :verify_key AND status = 'draft'
