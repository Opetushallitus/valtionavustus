select * from hakemukset
where user_key = :user_key and status = 'pending_change_request' and last_status_change_at = created_at
order by version;
