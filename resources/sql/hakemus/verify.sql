UPDATE hakemukset SET (status, verified_at) = ('draft_verified', now()) WHERE user_key = :user_key AND verify_key = :verify_key AND status = 'draft_unverified'
