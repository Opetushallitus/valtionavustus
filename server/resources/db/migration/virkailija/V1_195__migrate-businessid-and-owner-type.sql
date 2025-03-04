UPDATE hakija.hakemukset ha
SET
    business_id = fs.business_id,
    owner_type = fs.owner_type
FROM
(SELECT
    id,
    jsonb_path_query(answers, '$.value[*] ? (@.key == "business-id")')->>'value' as business_id,
    jsonb_path_query(answers, '$.value[*] ? (@.key == "radioButton-0")')->>'value' as owner_type
    FROM hakija.form_submissions)
 fs
WHERE fs.id = ha.form_submission_id
AND ha.version_closed is null;
