update arviot
set status        = :status, overridden_answers = :overridden_answers, budget_granted = :budget_granted,
  summary_comment = :summary_comment, changelog = :changelog, presenter_role_id = :presenter_role_id, roles = :roles,
  rahoitusalue    = :rahoitusalue, perustelut = :perustelut, costs_granted = :costs_granted, use_overridden_detailed_costs = :use_overridden_detailed_costs
where hakemus_id = :hakemus_id
