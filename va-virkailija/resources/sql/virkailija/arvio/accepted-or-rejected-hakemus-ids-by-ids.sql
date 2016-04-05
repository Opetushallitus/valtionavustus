select hakemus_id from arviot
where hakemus_id in (:hakemus_ids)
  and status in ('accepted', 'rejected')
