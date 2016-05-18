select * from hakemukset
where user_key = :user_key and status in ('pending_change_request', 'officer_edit') and last_status_change_at = created_at
order by version;
