WITH avustushakus AS (
  SELECT id AS avustushaku_id, *
  FROM hakija.avustushaut
  WHERE status <> 'deleted'
),
vastuuvalmistelijat AS (
  SELECT
    avustushaku AS avustushaku_id,
    name AS vastuuvalmistelija
  FROM avustushakus AS avustushaku
  JOIN hakija.avustushaku_roles ON avustushaku = avustushaku_id
  WHERE hakija.avustushaku_roles.role = 'vastuuvalmistelija'
),
paatokset_lahetetty AS (
  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS paatokset_lahetetty
  FROM avustushakus avustushaku
  JOIN virkailija.tapahtumaloki USING (avustushaku_id)
  WHERE success AND tapahtumaloki.tyyppi = 'paatoksen_lahetys'
  GROUP BY avustushaku_id
),
maksatukset AS (
  SELECT
    avustushaku.id AS avustushaku_id,
    min(hakemus_version.created_at) AS maksatukset_lahetetty,
    coalesce(sum(payment_sum), 0) AS maksatukset_summa
  FROM avustushakus avustushaku
  JOIN hakija.hakemukset hakemus_version ON hakemus_version.avustushaku = avustushaku.id
  JOIN virkailija.payments ON hakemus_version.id = payments.application_id AND hakemus_version.version = payments.application_version
  WHERE payments.version_closed is NULL AND payments.paymentstatus_id IN ('sent', 'paid')
  GROUP BY avustushaku.id
),
valiselvityspyynnot_lahetetty AS (
  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS valiselvitykset_lahetetty
  FROM avustushakus avustushaku
    JOIN virkailija.tapahtumaloki USING (avustushaku_id)
  WHERE success AND tapahtumaloki.tyyppi = 'valiselvitys-notification'
  GROUP BY avustushaku_id
),
loppuselvityspyynnot_lahetetty AS (
  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS loppuselvitykset_lahetetty
  FROM avustushakus avustushaku
  JOIN virkailija.tapahtumaloki USING (avustushaku_id)
  WHERE success AND tapahtumaloki.tyyppi = 'loppuselvitys-notification'
  GROUP BY avustushaku_id
),
use_detailed_costs AS (
  SELECT DISTINCT ON (avustushaku.id)
    avustushaku.id as avustushaku_id,
    a.use_overridden_detailed_costs
  FROM avustushakus avustushaku
  JOIN hakija.hakemukset h ON h.avustushaku = avustushaku.id
  JOIN virkailija.arviot a ON a.hakemus_id = h.id
  WHERE h.version_closed IS NULL AND
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
LEFT JOIN maksatukset USING (avustushaku_id)
LEFT JOIN valiselvityspyynnot_lahetetty USING (avustushaku_id)
LEFT JOIN loppuselvityspyynnot_lahetetty USING (avustushaku_id)
LEFT JOIN use_detailed_costs USING (avustushaku_id)
ORDER BY to_date(avustushaku.content#>>'{duration,start}','yyyy-MM-ddTHH24:MI:SS.MS') DESC, avustushaku.id DESC
