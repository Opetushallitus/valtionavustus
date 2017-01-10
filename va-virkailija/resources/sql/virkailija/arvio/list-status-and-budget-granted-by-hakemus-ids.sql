select hakemus_id, status, budget_granted
from arviot
where hakemus_id in (:hakemus_ids)
