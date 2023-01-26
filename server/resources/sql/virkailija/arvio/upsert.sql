insert into arviot (
  hakemus_id,
  status,
  overridden_answers,
  budget_granted,
  summary_comment,
  changelog,
  roles,
  presenter_role_id,
  rahoitusalue,
  talousarviotili,
  perustelut,
  costs_granted,
  use_overridden_detailed_costs,
  presentercomment,
  academysize,
  oppilaitokset,
  allow_visibility_in_external_system,
  should_pay,
  should_pay_comments)
values (
  :hakemus_id,
  :status,
  :overridden_answers,
  :budget_granted,
  :summary_comment,
  :changelog,
  :roles,
  :presenter_role_id,
  :rahoitusalue,
  :talousarviotili,
  :perustelut,
  :costs_granted,
  :use_overridden_detailed_costs,
  :presentercomment,
  :academysize,
  :oppilaitokset,
  :allow_visibility_in_external_system,
  :should_pay,
  :should_pay_comments)
ON CONFLICT (hakemus_id) DO UPDATE SET
  status = EXCLUDED.status,
  overridden_answers = EXCLUDED.overridden_answers,
  budget_granted = EXCLUDED.budget_granted,
  summary_comment = EXCLUDED.summary_comment,
  changelog = EXCLUDED.changelog,
  roles = EXCLUDED.roles,
  presenter_role_id = EXCLUDED.presenter_role_id,
  rahoitusalue = EXCLUDED.rahoitusalue,
  talousarviotili = EXCLUDED.talousarviotili,
  perustelut = EXCLUDED.perustelut,
  costs_granted = EXCLUDED.costs_granted,
  use_overridden_detailed_costs = EXCLUDED.use_overridden_detailed_costs,
  presentercomment = EXCLUDED.presentercomment,
  academysize = EXCLUDED.academysize,
  oppilaitokset = EXCLUDED.oppilaitokset,
  allow_visibility_in_external_system = EXCLUDED.allow_visibility_in_external_system,
  should_pay = EXCLUDED.should_pay,
  should_pay_comments = EXCLUDED.should_pay_comments