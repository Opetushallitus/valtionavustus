(ns oph.va.virkailija.excel.all-avustushakus-export
  (:require [dk.ative.docjure.spreadsheet :as spreadsheet]
            [clojure.string :refer [join]]
            [oph.soresu.common.db :refer [query]]
            [oph.common.datetime :refer [from-sql-time date-string parse-date time-string java8-date-string]])
  (:import [java.io ByteArrayOutputStream]))

(def export-data-query "
WITH avustushakus_to_export AS (
  SELECT id AS avustushaku_id, *
  FROM hakija.avustushaut
  WHERE status not in ('deleted', 'draft')
),
paatos_counts AS (
  SELECT
    avustushaku.id AS avustushaku_id,
    count(*) FILTER (WHERE arviot.status = 'accepted') AS hyvaksytty_count,
    count(*) FILTER (WHERE arviot.status = 'rejected') AS hylatty_count
  FROM avustushakus_to_export avustushaku
  LEFT JOIN hakija.hakemukset hakemus_version ON avustushaku.id = hakemus_version.avustushaku
  LEFT JOIN virkailija.arviot ON hakemus_version.id = arviot.hakemus_id
  WHERE hakemus_version.version_closed IS NULL
  GROUP BY avustushaku.id
),
maksatukset AS (
  SELECT
    avustushaku.id AS avustushaku_id,
    min(hakemus_version.created_at) AS maksatukset_lahetetty,
    coalesce(sum(payment_sum), 0) AS maksatukset_summa
  FROM avustushakus_to_export avustushaku
  JOIN hakija.hakemukset hakemus_version ON hakemus_version.avustushaku = avustushaku.id
  JOIN virkailija.payments ON hakemus_version.id = payments.application_id AND hakemus_version.version = payments.application_version
  WHERE payments.version_closed is NULL AND payments.paymentstatus_id IN ('sent', 'paid')
  GROUP BY avustushaku.id
),
vastuuvalmistelijat AS (
  SELECT
    avustushaku AS avustushaku_id,
    name AS vastuuvalmistelija_name,
    email AS vastuuvalmistelija_email
  FROM avustushakus_to_export AS avustushaku
  JOIN hakija.avustushaku_roles ON avustushaku = avustushaku_id
  WHERE hakija.avustushaku_roles.role = 'vastuuvalmistelija'
),
paatokset_lahetetty AS (
  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS paatokset_lahetetty
  FROM avustushakus_to_export avustushaku
  JOIN virkailija.tapahtumaloki USING (avustushaku_id)
  WHERE success AND tapahtumaloki.tyyppi = 'paatoksen_lahetys'
  GROUP BY avustushaku_id
),
valiselvityspyynnot_lahetetty AS (
  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS valiselvitykset_lahetetty
  FROM avustushakus_to_export avustushaku
    JOIN virkailija.tapahtumaloki USING (avustushaku_id)
  WHERE success AND tapahtumaloki.tyyppi = 'valiselvitys-notification'
  GROUP BY avustushaku_id
),
loppuselvityspyynnot_lahetetty AS (
  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS loppuselvitykset_lahetetty
  FROM avustushakus_to_export avustushaku
  JOIN virkailija.tapahtumaloki USING (avustushaku_id)
  WHERE success AND tapahtumaloki.tyyppi = 'loppuselvitys-notification'
  GROUP BY avustushaku_id
),
grouped_raportointivelvoitteet AS (
  SELECT avustushaku_id, jsonb_agg(rv.*) AS raportointivelvoitteet
  FROM avustushakus_to_export avustushaku
  JOIN raportointivelvoite rv USING (avustushaku_id)
  GROUP BY avustushaku_id
),
lainsaadanto_str AS (
  SELECT avustushaku_id, jsonb_agg(l.name ORDER BY name ASC) AS lainsaadanto
  FROM avustushakus_to_export avustushaku
  JOIN avustushaku_lainsaadanto al USING (avustushaku_id)
  JOIN lainsaadanto l ON al.lainsaadanto_id = l.id
  GROUP BY avustushaku_id
),
talousarviotili AS (
  SELECT
      avustushaku_id,
      jsonb_agg(
          jsonb_build_object(
              'rahoitusalue',
              koulutusaste,
              'talousarviotilit',
              tilit
          )
      ) as tilit
  FROM (
      SELECT
          avustushaku_id,
          jsonb_array_elements(koulutusasteet) as koulutusaste,
          jsonb_agg(t.code) as tilit
      FROM virkailija.avustushaku_talousarviotilit at
      JOIN virkailija.talousarviotilit t ON talousarviotili_id = t.id
      JOIN hakija.avustushaut a ON at.avustushaku_id = a.id
      GROUP BY koulutusaste, avustushaku_id
  ) as rahoitusaluetilit
  GROUP BY avustushaku_id
),
projektikoodi AS (
  SELECT
    avustushaku_id,
    coalesce(jsonb_agg(va_code_values.code_value), '[]'::jsonb) AS projects
  FROM avustushakus_to_export avustushaku
  LEFT JOIN avustushaku_project_code USING (avustushaku_id)
  LEFT JOIN va_code_values ON va_code_values.id = project_id
  GROUP BY avustushaku_id
)
SELECT
  avustushaku.id AS avustushaku_id,
  avustushaku.register_number AS asiatunnus,
  avustushaku.content->'name'->>'fi' AS avustushaku_name,
  CASE
      WHEN avustushaku.content->'rahoitusalueet' IS NULL THEN talousarviotili.tilit
      WHEN jsonb_array_length(avustushaku.content->'rahoitusalueet') = 0 THEN talousarviotili.tilit
      ELSE avustushaku.content->'rahoitusalueet'
  END as koulutusasteet,
  raportointivelvoitteet,
  lainsaadanto,
  avustushaku.haku_type AS avustuslaji,
  vastuuvalmistelija_name,
  vastuuvalmistelija_email,
  paatos_counts.hyvaksytty_count,
  paatos_counts.hylatty_count,
  paatos_counts.hyvaksytty_count + paatos_counts.hylatty_count AS paatokset_total_count,
  (avustushaku.content->'duration'->>'start')::timestamptz AS avustushaku_duration_start,
  (avustushaku.content->'duration'->>'end')::timestamptz AS avustushaku_duration_end,
  paatokset_lahetetty,
  avustushaku.valiselvitysdate AS valiselvitys_deadline,
  valiselvitykset_lahetetty,
  avustushaku.loppuselvitysdate AS loppuselvitys_deadline,
  loppuselvitykset_lahetetty,
  avustushaku.content->'total-grant-size' AS avustushaku_maararaha,
  coalesce(maksatukset_summa, 0) as maksatukset_summa,
  (avustushaku.content->>'total-grant-size')::numeric - maksatukset_summa AS jakamaton_maararaha,
  avustushaku.hankkeen_alkamispaiva AS ensimmainen_kayttopaiva,
  avustushaku.hankkeen_paattymispaiva AS viimeinen_kayttopaiva,
  avustushaku.arvioitu_maksupaiva AS arvioitu_maksupaiva,
  projektikoodi.projects AS projects,
  toimintayksikko.code AS toimintayksikko_code,
  toimintayksikko.code_value AS toimintayksikko_code_value,
  toimintayksikko.year AS toimintayksikko_year,
  toiminto.code AS toiminto_code,
  toiminto.code_value AS toiminto_code_value,
  toiminto.year AS toiminto_year,
  avustushaku.content->'rahoitusalueet' AS rahoitusalueet
FROM avustushakus_to_export avustushaku
LEFT JOIN paatos_counts USING (avustushaku_id)
LEFT JOIN maksatukset USING (avustushaku_id)
LEFT JOIN vastuuvalmistelijat USING (avustushaku_id)
LEFT JOIN paatokset_lahetetty USING (avustushaku_id)
LEFT JOIN valiselvityspyynnot_lahetetty USING (avustushaku_id)
LEFT JOIN loppuselvityspyynnot_lahetetty USING (avustushaku_id)
LEFT JOIN grouped_raportointivelvoitteet USING (avustushaku_id)
LEFT JOIN lainsaadanto_str USING (avustushaku_id)
LEFT JOIN projektikoodi USING (avustushaku_id)
LEFT JOIN virkailija.va_code_values toimintayksikko ON toimintayksikko.id = avustushaku.operational_unit_id
LEFT JOIN virkailija.va_code_values toiminto ON toiminto.id = avustushaku.operation_id
LEFT JOIN talousarviotili USING (avustushaku_id)
ORDER BY avustushaku.id DESC
")

(defn format-sql-timestamp [ts]
  (let [dt (from-sql-time ts)]
    (str (date-string dt) " " (time-string dt))))

(defn format-sql-timestamp-as-date [ts]
  (date-string (from-sql-time ts)))

(defn koulutusaste-columns [koulutusaste]
  [(:rahoitusalue koulutusaste)
   (clojure.string/join ", " (:talousarviotilit koulutusaste))])

(defn expand-koulutusasteet [n row]
  (let [dummy-value {:rahoitusalue ""
                     :talousarviotilit []}]
    (apply concat (vec (map-indexed
      (fn [idx _] (koulutusaste-columns (nth (:koulutusasteet row) idx dummy-value)))
      (repeat n nil))))))

(defn- raportointivelvoite-str [rv]
  (if (= rv "")
    ""
    (let [lisatiedot (if (= (:lisatiedot rv) "") "" (str " (" (:lisatiedot rv) ")"))
          maaraaika (date-string (parse-date (:maaraaika rv)))]
      (str (:raportointilaji rv) ": " (:asha_tunnus rv) ", " maaraaika lisatiedot))))

(defn expand-raportointivelvoitteet [n row]
  (apply concat (vec (map-indexed
    (fn [idx _] [(raportointivelvoite-str (nth (:raportointivelvoitteet row) idx ""))])
    (repeat n nil)))))

(defn db-row->excel-row [row max-koulutusaste-count max-raportointivelvoitteet-count]
  (concat
    [(:avustushaku-id row)
     (or (:avustushaku-name row) "")
     (or (:avustuslaji row) "")]
    (expand-koulutusasteet max-koulutusaste-count row)
    (expand-raportointivelvoitteet max-raportointivelvoitteet-count row)
    [(format-sql-timestamp (:avustushaku-duration-start row))
     (format-sql-timestamp (:avustushaku-duration-end row))
     (cond
       (:valiselvitykset-lahetetty row) (format-sql-timestamp (:valiselvitykset-lahetetty row))
       (:valiselvitys-deadline row) (str (java8-date-string (:valiselvitys-deadline row)) " DL")
       :else "")
     (cond
       (:loppuselvitykset-lahetetty row) (format-sql-timestamp (:loppuselvitykset-lahetetty row))
       (:loppuselvitys-deadline row) (str (java8-date-string (:loppuselvitys-deadline row)) " DL")
       :else "")
     (or (:asiatunnus row) "")
     (or (:avustushaku-maararaha row) "")
     (or (:toimintayksikko-code-value row) "")
     (clojure.string/join ", " (:projects row))
     (or (:toiminto-code-value row) "")
     (or (:maksatukset-lahetetty row) "")
     (or (:maksatukset-summa row) "")
     (or (:jakamaton-maararaha row) "")
     (if (:paatokset-lahetetty row) (format-sql-timestamp-as-date (:paatokset-lahetetty row)) "")
     (str (:paatokset-total-count row) "/" (:hyvaksytty-count row) "/" (:hylatty-count row))
     (if (:ensimmainen-kayttopaiva row) (java8-date-string (:ensimmainen-kayttopaiva row)) "")
     (if (:viimeinen-kayttopaiva row) (java8-date-string (:viimeinen-kayttopaiva row)) "")
     (if (:vastuuvalmistelija-name row)
       (str (:vastuuvalmistelija-name row) ", " (:vastuuvalmistelija-email row))
       "")
     (if (:lainsaadanto row)
       (join ", " (:lainsaadanto row))
       "")
     ""
     (if (:arvioitu-maksupaiva row) (java8-date-string (:arvioitu-maksupaiva row)) "")
     ]))

(defn koulutusaste-headers [n]
  (let [header-pairs (map-indexed
                       (fn [idx _] [(str "Koulutusaste " (+ idx 1))
                                    (str "TA-tilit " (+ idx 1))])
                       (repeat n nil))]
    (apply concat header-pairs)))

(defn raportointivelvoite-headers [n]
  (let [headers (map-indexed
                  (fn [idx _] [(str "Raportointivelvoite " (+ idx 1))])
                  (repeat n nil))]
    (apply concat headers)))

(defn headers [max-koulutusaste-count max-raportointivelvoite-count]
  [(concat
     ["" "" ""]
     (repeat (* 2 max-koulutusaste-count) "")
     (repeat max-raportointivelvoite-count "")
     ["" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "Manuaalisesti täydennettävät"])
   (concat
     ["Haun ID"
      "Avustuksen nimi"
      "Avustuslaji"]
     (koulutusaste-headers max-koulutusaste-count)
     (raportointivelvoite-headers max-raportointivelvoite-count)
     ["Haku auki"
      "Haku kiinni"
      "Väliselvitys lähetetty/DL"
      "Loppuselvitys lähetetty/DL"
      "Asiatunnus"
      "Määräraha (€)"
      "Toimintayksikkö"
      "Projektit"
      "Toiminto"
      "Maksettu pvm"
      "Maksettu €"
      "Jakamaton (määräraha miinus maksettu)"
      "Päätös pvm"
      "Päätösten lkm, yht/myönteinen/kielteinen"
      "1. käyttöpäivä"
      "viimeinen käyttöpäivä"
      "Vastuuvalmistelija"
      "Lainsäädäntö"
      ; Manuaalisesti täydennettävät
      "Määrärahan nimi talousarviossa"
      "Arvioitu maksu pvm"
      "Käytettävä määräraha sidottu/purettu kirjanpidossa pvm"
      "Noudatettava lainsäädäntö"
      "OKM raportointivaatimukset"])])

(defn export-avustushakus []
  (let [data (query export-data-query [])
        output (ByteArrayOutputStream.)
        max-koulutusaste-count (apply max (map (comp count :koulutusasteet) data))
        max-raportointivelvoite-count (apply max (map (comp count :raportointivelvoitteet) data))
        wb (spreadsheet/create-workbook
             "Avustushaut"
             (concat
               (headers max-koulutusaste-count max-raportointivelvoite-count)
               (vec (map #(db-row->excel-row % max-koulutusaste-count max-raportointivelvoite-count) data))))]
    (.write wb output)
    (.toByteArray output)))
