update hakija.hakemus_paatokset
set sent_emails = :sent_emails, decision = :decision, sent_time = now()
where hakemus_id = :hakemus_id
and hakemus_version = :hakemus_version

