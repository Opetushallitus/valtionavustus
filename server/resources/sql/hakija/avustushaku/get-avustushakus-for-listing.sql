WITH avustushakus AS (
  SELECT id AS avustushaku_id, *
  FROM hakija.avustushaut
  WHERE status <> 'deleted'
),
vastuuvalmistelijat AS (
  SELECT
    avustushaku AS avustushaku_id,
    name AS vastuuvalmistelija
  FROM hakija.avustushaku_roles
  WHERE avustushaku IN (SELECT id FROM avustushakus) AND
        hakija.avustushaku_roles.role = 'vastuuvalmistelija'
),
paatokset_lahetetty AS (
  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS paatokset_lahetetty
  FROM virkailija.tapahtumaloki
  WHERE tapahtumaloki.avustushaku_id IN (SELECT id FROM avustushakus) AND
        success AND
        tapahtumaloki.tyyppi = 'paatoksen_lahetys'
  GROUP BY avustushaku_id
),
maksatukset_lahetetty AS (
  SELECT
    hakemus_version.avustushaku AS avustushaku_id,
    min(payments.created_at) AS maksatukset_lahetetty
  FROM hakija.hakemukset hakemus_version
  JOIN virkailija.payments ON hakemus_version.id = payments.application_id AND hakemus_version.version = payments.application_version
  WHERE hakemus_version.avustushaku IN (SELECT id FROM avustushakus) AND
        payments.deleted is NULL AND
        payments.paymentstatus_id = 'sent'
  GROUP BY hakemus_version.avustushaku
),
maksatukset_summa AS (
  SELECT
    hakemus_version.avustushaku AS avustushaku_id,
    coalesce(sum(payment_sum), 0) AS maksatukset_summa
  FROM hakija.hakemukset hakemus_version
  JOIN virkailija.payments ON hakemus_version.id = payments.application_id AND hakemus_version.version = payments.application_version
  WHERE hakemus_version.avustushaku IN (SELECT id FROM avustushakus) AND
        payments.version_closed is NULL AND
        payments.paymentstatus_id IN ('sent', 'paid')
  GROUP BY hakemus_version.avustushaku
),
valiselvityspyynnot_lahetetty AS (
  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS valiselvitykset_lahetetty
  FROM virkailija.tapahtumaloki
  WHERE avustushaku_id IN (SELECT id FROM avustushakus) AND
        success AND
        tapahtumaloki.tyyppi = 'valiselvitys-notification'
  GROUP BY avustushaku_id
),
loppuselvityspyynnot_lahetetty AS (
  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS loppuselvitykset_lahetetty
  FROM virkailija.tapahtumaloki
  WHERE avustushaku_id IN (SELECT id FROM avustushakus) AND
        success AND
        tapahtumaloki.tyyppi = 'loppuselvitys-notification'
  GROUP BY avustushaku_id
),
use_detailed_costs AS (
  SELECT DISTINCT ON (h.avustushaku)
    h.avustushaku as avustushaku_id,
    a.use_overridden_detailed_costs
  FROM hakija.hakemukset h
  JOIN virkailija.arviot a ON a.hakemus_id = h.id
  WHERE h.avustushaku IN (SELECT id FROM avustushakus) AND
        h.version_closed IS NULL AND
        a.status = 'accepted'
)
SELECT
  avustushaku.*,
  vastuuvalmistelija,
  paatokset_lahetetty,
  maksatukset_lahetetty,
  valiselvitykset_lahetetty,
  loppuselvitykset_lahetetty,
  maksatukset_summa,
  use_overridden_detailed_costs
FROM avustushakus avustushaku
LEFT JOIN vastuuvalmistelijat USING (avustushaku_id)
LEFT JOIN paatokset_lahetetty USING (avustushaku_id)
LEFT JOIN maksatukset_lahetetty USING (avustushaku_id)
LEFT JOIN maksatukset_summa USING (avustushaku_id)
LEFT JOIN valiselvityspyynnot_lahetetty USING (avustushaku_id)
LEFT JOIN loppuselvityspyynnot_lahetetty USING (avustushaku_id)
LEFT JOIN use_detailed_costs USING (avustushaku_id)
ORDER BY to_date(avustushaku.content#>>'{duration,start}','yyyy-MM-ddTHH24:MI:SS.MS') DESC, avustushaku.id DESC
