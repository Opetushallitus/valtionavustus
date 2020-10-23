WITH
  erityisavustus AS (
    SELECT id, form_loppuselvitys, content
    FROM avustushaut
    WHERE haku_type = 'erityisavustus'
    ORDER BY id
  ),
  hakemus AS (
    SELECT id, avustushaku, organization_name, project_name
    FROM hakemukset
    WHERE hakemus_type = 'hakemus'
      AND status_loppuselvitys = 'accepted'
      AND version_closed IS NULL
    ORDER BY avustushaku
  ),
  loppuselvitys AS (
    SELECT
        parent_id
      , avustushaku
      , organization_name
      , project_name
      , form_submission_id
      , form_submission_version
    FROM hakemukset
    WHERE hakemus_type = 'loppuselvitys'
      AND status = 'submitted'
      AND version_closed IS NULL
    ORDER BY avustushaku
  ),
  answer AS (
    SELECT
        erityisavustus.id AS haku_id
      , hakemus.organization_name AS organization_name
      , hakemus.project_name AS project_name
      , form_submissions.answers AS loppuselvitys_answers
    FROM loppuselvitys
    JOIN erityisavustus
      ON erityisavustus.id = loppuselvitys.avustushaku
    JOIN hakemus
      ON hakemus.id = loppuselvitys.parent_id
    JOIN form_submissions
      ON loppuselvitys.form_submission_id = form_submissions.id
     AND loppuselvitys.form_submission_version = form_submissions.version
  ),
  answer_json AS (SELECT json_agg(answer) FROM answer),
  haku AS (
    SELECT
      DISTINCT(erityisavustus.id) AS id,
      erityisavustus.content AS content,
      forms.content AS loppuselvitys_form
    FROM erityisavustus
    JOIN hakemus
      ON erityisavustus.id = hakemus.avustushaku
    JOIN forms
      ON forms.id = form_loppuselvitys
  ),
  haku_json AS (SELECT json_agg(haku) FROM haku)
SELECT
  json_build_object(
    'haku', haku_json.json_agg,
    'loppuselvitys', answer_json.json_agg
  ) AS dump
FROM haku_json, answer_json
