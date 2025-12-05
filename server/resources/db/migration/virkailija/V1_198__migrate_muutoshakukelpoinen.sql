ALTER TABLE avustushaut DROP CONSTRAINT nn_alkamispaiva;
ALTER TABLE avustushaut DROP CONSTRAINT nn_paattymispaiva;

WITH recursive formfield(form_id, formfield_id, label, children) AS (
    SELECT
      forms.id AS form_id,
      e.value->>'id' AS formfield_id,
      e.value->'label'->>'fi' AS label,
      e.value->'children' AS children
    FROM hakija.forms
    JOIN jsonb_array_elements(forms.content) e ON true
    UNION ALL
    SELECT
      parent.form_id,
      child->>'id' AS formfield_id,
      child->'label'->>'fi' AS label,
      child->'children' AS children
    FROM formfield parent
    JOIN jsonb_array_elements(parent.children) child ON true
  ),
  required_fields AS (
    SELECT unnest(ARRAY['project-name','applicant-name','primary-email','textField-0','financing-plan']) AS field_id
  ),
  found_fields AS (
    SELECT
      avustushaut.id AS avustushaku_id,
      formfield.formfield_id
    FROM hakija.avustushaut
    JOIN formfield ON formfield.form_id = avustushaut.form
    WHERE (
      formfield.formfield_id = ANY(ARRAY['project-name','applicant-name','primary-email','textField-0'])
      OR (formfield.formfield_id = 'financing-plan' AND
          EXISTS(SELECT formfield.children->'budget'->'project-budget' FROM formfield))
    )
  ),
  muutoshakukelvottomat AS (
    SELECT
      a.id AS avustushaku_id
    FROM hakija.avustushaut a
    CROSS JOIN required_fields rf
    LEFT JOIN found_fields ff ON ff.avustushaku_id = a.id AND ff.formfield_id = rf.field_id
    WHERE a.muutoshakukelpoinen = true
    GROUP BY a.id
    HAVING COUNT(DISTINCT rf.field_id) != COUNT(DISTINCT ff.formfield_id)
  )
  UPDATE hakija.avustushaut
  SET muutoshakukelpoinen = false
  WHERE id IN (SELECT avustushaku_id FROM muutoshakukelvottomat);

ALTER TABLE avustushaut ADD CONSTRAINT nn_alkamispaiva
    check (hankkeen_alkamispaiva IS NOT NULL OR (status != 'published' AND status != 'resolved')) NOT VALID;

ALTER TABLE avustushaut ADD CONSTRAINT nn_paattymispaiva
    check (hankkeen_paattymispaiva IS NOT NULL OR (status != 'published' AND status != 'resolved')) NOT VALID;
