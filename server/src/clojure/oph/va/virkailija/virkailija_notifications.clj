(ns oph.va.virkailija.virkailija-notifications
  (:require [clojure.tools.logging :as log]
            [oph.soresu.common.db :refer [query]]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.hakija.jotpa :refer [is-jotpa-avustushaku]]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.tasmaytysraportti :as tasmaytysraportti]))

(defn- get-loppuselvitys-asiatarkastamatta []
  (query "SELECT h.avustushaku as avustushaku_id, count(h.id) as hakemus_count, r.email
          FROM hakemukset h
          LEFT JOIN arviot a ON h.id = a.hakemus_id
          LEFT JOIN avustushaku_roles r ON a.presenter_role_id = r.id
          JOIN hakija.avustushaut ah ON ah.id = h.avustushaku
          WHERE h.status_loppuselvitys = 'submitted' AND h.version_closed IS NULL AND r.email IS NOT NULL
          GROUP BY avustushaku_id, r.email"
         []))

(defn- get-hakuaika-paattymassa-haut []
  (query "SELECT h.id, h.avustushaku as avustushaku_id, h.user_key, hakemus.contact_email AS contact_email,
            h.language, h.business_id,
            jsonb_extract_path_text(avustushaku.content, 'name', h.language) as avustushaku_name,
            avustushaku.content->'duration'->>'end' AS paattymispaiva
          FROM hakija.hakemukset h
          JOIN hakija.avustushaut avustushaku
            ON h.avustushaku = avustushaku.id
          JOIN virkailija.normalized_hakemus hakemus
            ON h.id = hakemus.hakemus_id
          WHERE version_closed IS NULL
          AND hakemus_type = 'hakemus'
          AND h.status = 'draft'
          AND date(avustushaku.content -> 'duration' ->> 'end') = date(now() + interval '1 DAY')"
         []))

(defn send-loppuselvitys-asiatarkastamatta-notifications []
  (let [rows    (get-loppuselvitys-asiatarkastamatta)
        grouped (group-by :email rows)]
    (doseq [keyval grouped]
      (email/send-loppuselvitys-asiatarkastamatta [(key keyval)] (val keyval)))))

(defn- get-loppuselvitys-taloustarkastamatta []
  (query "SELECT avustushaku as avustushaku_id, count(id) as hakemus_count
          FROM hakemukset
          WHERE status_loppuselvitys = 'information_verified' AND version_closed IS NULL
          GROUP BY avustushaku_id"
         []))

(defn send-loppuselvitys-taloustarkastamatta-notifications []
  (let [loppuselvitys-list (get-loppuselvitys-taloustarkastamatta)]
    (when (>= (count loppuselvitys-list) 1)
      (email/send-loppuselvitys-taloustarkastamatta loppuselvitys-list))))

(defn send-hakuaika-paattymassa-notifications []
  (let [hakemukset-list (get-hakuaika-paattymassa-haut)
        hakemukset-paattymassa-count (count hakemukset-list)]
    (when (>= hakemukset-paattymassa-count 1)
      (log/info "sending email to" hakemukset-paattymassa-count " contacts")
      (doseq [hakemus hakemukset-list]
        (email/send-hakuaika-paattymassa hakemus (hakija-api/get-avustushaku (:avustushaku-id hakemus)))))))

(defn get-avustushaut-ended-yesterday []
  (query "WITH notification_recipients AS (
            SELECT
              avustushaku AS avustushaku_id,
              jsonb_agg(DISTINCT email) AS \"to\"
            FROM hakija.avustushaku_roles
            WHERE (role = 'presenting_officer' OR role = 'vastuuvalmistelija')
              AND email IS NOT NULL
            GROUP BY avustushaku
          ),
          hakemus_totals as (
            SELECT
              avustushaku as avustushaku_id,
              count(*) as hakemus_count,
              sum(budget_oph_share) as haettu_total_eur
            FROM hakija.hakemukset
            WHERE version_closed IS NULL
              AND status = 'submitted'
            GROUP BY avustushaku
          )
          SELECT
            ah.id as avustushaku_id,
            jsonb_extract_path_text(ah.content, 'name', 'fi') as avustushaku_name,
            hakemus_totals.hakemus_count,
            hakemus_totals.haettu_total_eur,
            notification_recipients.to
          FROM hakija.avustushaut ah
          JOIN notification_recipients ON notification_recipients.avustushaku_id = ah.id
          JOIN hakemus_totals ON hakemus_totals.avustushaku_id = ah.id
          -- content->'duration'->>'end' is UTC timestamp so we have to explicitly convert
          -- to finnish time to avoid e.g. 13.1.2022 0.00 finnish time (12.1.2022 22.00 utc)
          -- being interpreted as 2022-01-12 instead of 2022-01-13 which the user has input
          WHERE date(timestamptz(ah.content->'duration'->>'end') at time zone 'Europe/Helsinki')
              = date(current_timestamp) - '1 day'::interval
         " []))

(defn send-hakuaika-paattynyt-notifications []
  (let [notifications (get-avustushaut-ended-yesterday)]
    (when (>= (count notifications) 1)
      (log/info "Sending" (count notifications) "hakuaika-päättynyt notifications")
      (doseq [n notifications]
        (email/send-hakuaika-paattynyt n)))))

(defn- get-valiselvitys-tarkastamatta []
  (query "SELECT h.avustushaku, count(h.id) as hakemus_count, r.email
          FROM hakemukset h
          LEFT JOIN arviot a ON h.id = a.hakemus_id
          LEFT JOIN avustushaku_roles r ON a.presenter_role_id = r.id
          JOIN hakija.avustushaut ah ON ah.id = h.avustushaku
          WHERE h.status_valiselvitys = 'submitted' AND h.version_closed IS NULL AND r.email IS NOT NULL
          AND ah.created_at > '2020-01-01'::timestamp
          GROUP BY h.avustushaku, r.email"
         []))

(defn send-valiselvitys-tarkastamatta-notifications []
  (let [rows    (get-valiselvitys-tarkastamatta)
        grouped (group-by :email rows)]
    (doseq [keyval grouped]
      (email/send-valiselvitys-tarkastamatta [(key keyval)] (val keyval)))))

(defn- get-muutoshakemuksia-kasittelematta []
  (query "WITH kasittelematta AS (
            SELECT ahr.email      AS ukotettu_email,
                   h.avustushaku  AS avustushaku_id,
                   count(m.id)    AS muutoshakemus_count
            FROM hakija.hakemukset h
                     JOIN virkailija.muutoshakemus m    ON h.id = m.hakemus_id
                     JOIN virkailija.arviot a           ON a.hakemus_id = h.id
                     JOIN hakija.avustushaku_roles ahr  ON ahr.id = a.presenter_role_id
            WHERE h.version_closed IS NULL AND
                  m.paatos_id IS NULL AND
                  ahr.email IS NOT NULL
            GROUP BY ahr.email, h.avustushaku
         ) SELECT
            kasittelematta.avustushaku_id,
            kasittelematta.ukotettu_email as \"to\",
            jsonb_agg(
              jsonb_build_object(
                'avustushaku-id', kasittelematta.avustushaku_id,
                'count', kasittelematta.muutoshakemus_count
              )
            ) AS list
           FROM kasittelematta
           GROUP BY kasittelematta.ukotettu_email, kasittelematta.avustushaku_id"
         []))

(defn send-muutoshakemuksia-kasittelematta-notifications []
  (let [notifications (get-muutoshakemuksia-kasittelematta)]
    (doseq [notification notifications]
      (email/send-muutoshakemuksia-kasittelematta notification))))

(defn- get-loppuselvitys-palauttamatta []
  (query "SELECT
            avustushaut.id as avustushaku_id,
            h.hakemus_id,
            hv.language,
            hv.business_id,
            jsonb_extract_path_text(avustushaut.content, 'name', hv.language) as avustushaku_name,
            hv.user_key,
            coalesce(
              latest_jatkoaika.hyvaksytty_jatkoaika,
              avustushaut.loppuselvitysdate::date
            ) AS loppuselvitys_deadline,
            h.contact_email
          FROM hakija.hakemukset hv
          JOIN virkailija.arviot ON hv.id = arviot.hakemus_id
          JOIN hakija.avustushaut ON hv.avustushaku = avustushaut.id
          JOIN virkailija.normalized_hakemus h ON hv.id = h.hakemus_id
          LEFT JOIN LATERAL (
            SELECT coalesce(
              pj.paattymispaiva,
              mh.haettu_kayttoajan_paattymispaiva
            ) AS hyvaksytty_jatkoaika
            FROM virkailija.muutoshakemus mh
            JOIN virkailija.paatos mhp ON mhp.id = mh.paatos_id
            JOIN virkailija.paatos_jatkoaika pj USING (paatos_id)
            WHERE mh.hakemus_id = hv.id
            AND mh.haen_kayttoajan_pidennysta AND pj.status IN ('accepted', 'accepted_with_changes')
            ORDER BY mhp.created_at DESC
            LIMIT 1
          ) latest_jatkoaika ON true
          WHERE hv.hakemus_type = 'hakemus'
            AND hv.version_closed IS NULL
            AND arviot.status = 'accepted'
            AND hv.status_loppuselvitys = 'missing'
            -- There are a few nulls
            AND avustushaut.loppuselvitysdate IS NOT NULL
            AND coalesce(
              latest_jatkoaika.hyvaksytty_jatkoaika,
              avustushaut.loppuselvitysdate::date
            ) BETWEEN current_timestamp::date AND current_timestamp::date + '14 days'::interval
            AND EXISTS (
              SELECT * FROM tapahtumaloki
              WHERE tapahtumaloki.hakemus_id = h.hakemus_id
                AND tyyppi = 'loppuselvitys-notification'
            )
            AND NOT EXISTS (
              SELECT * FROM email_event e
              WHERE e.hakemus_id = h.hakemus_id
                AND e.email_type = 'loppuselvitys-palauttamatta'
            )"
         []))

(defn send-loppuselvitys-palauttamatta-notifications []
  (let [notifications (get-loppuselvitys-palauttamatta)]
    (when (>= (count notifications) 1)
      (log/info "sending email to" (count notifications) " contacts")
      (doseq [notification notifications]
        (email/send-loppuselvitys-palauttamatta notification
                                                (is-jotpa-avustushaku (hakija-api/get-avustushaku (:avustushaku-id notification))))))))

(defn- get-valiselvitys-palauttamatta []
  (query "SELECT
            avustushaut.id as avustushaku_id,
            h.hakemus_id,
            hv.language,
            hv.business_id,
            jsonb_extract_path_text(avustushaut.content, 'name', hv.language) as avustushaku_name,
            hv.user_key,
            avustushaut.valiselvitysdate::date AS valiselvitys_deadline,
            h.contact_email
          FROM hakija.hakemukset hv
          JOIN virkailija.arviot ON hv.id = arviot.hakemus_id
          JOIN hakija.avustushaut ON hv.avustushaku = avustushaut.id
          JOIN virkailija.normalized_hakemus h ON hv.id = h.hakemus_id
          WHERE hv.hakemus_type = 'hakemus'
            AND hv.version_closed IS NULL
            AND arviot.status = 'accepted'
            AND hv.status_valiselvitys = 'missing'
            AND avustushaut.valiselvitysdate IS NOT NULL
            AND avustushaut.valiselvitysdate::date BETWEEN current_timestamp::date AND current_timestamp::date + '14 days'::interval
            AND EXISTS (
              SELECT * FROM tapahtumaloki
              WHERE tapahtumaloki.hakemus_id = h.hakemus_id
                AND tyyppi = 'valiselvitys-notification'
            )
            AND NOT EXISTS (
              SELECT * FROM email_event e
              WHERE e.hakemus_id = h.hakemus_id
                AND e.email_type = 'valiselvitys-palauttamatta'
            )"
         []))

(defn send-valiselvitys-palauttamatta-notifications []
  (let [notifications (get-valiselvitys-palauttamatta)]
    (doseq [notification notifications]
      (email/send-valiselvitys-palauttamatta notification (is-jotpa-avustushaku (hakija-api/get-avustushaku (:avustushaku-id notification)))))))

(defn- get-laheta-selvityspyynnot [{:keys [date-field status-field notify-before-deadline tapahtumaloki-tyyppi]}]
  (query (str "SELECT
            a.id AS avustushaku_id,
            a." date-field " AS deadline,
            jsonb_agg(r.email) AS to,
            (a.content -> 'name' ->> 'fi') AS avustushaku_name
          FROM avustushaut a
          JOIN hakija.avustushaku_roles r ON r.avustushaku = a.id
          WHERE EXISTS (
                  SELECT *
                    FROM hakemus_paatokset p
                    JOIN hakemukset h ON p.hakemus_id = h.id
                    JOIN arviot arvio ON arvio.hakemus_id = h.id
                    WHERE h.avustushaku = a.id
                      AND h.version_closed IS NULL
                      AND h.refused IS NOT TRUE
                      AND arvio.status = 'accepted'
                      AND h." status-field " NOT IN ('submitted', 'information_verified', 'accepted')
                      AND NOT EXISTS (
                        SELECT *
                        FROM tapahtumaloki
                        WHERE tapahtumaloki.hakemus_id = h.id
                          AND tyyppi = ?
                      )
                )
            AND " date-field " IS NOT NULL
            AND current_timestamp::date BETWEEN (" date-field "::date - ?::interval) AND " date-field "::date
            AND (r.role = 'presenting_officer' OR r.role = 'vastuuvalmistelija')
            AND r.email IS NOT NULL
          GROUP BY avustushaku_name, " date-field ", avustushaku_id")
         [tapahtumaloki-tyyppi notify-before-deadline]))

(defn send-laheta-valiselvityspyynnot-notifications []
  (let [notifications (get-laheta-selvityspyynnot {:date-field "valiselvitysdate"
                                                   :status-field "status_valiselvitys"
                                                   :tapahtumaloki-tyyppi "valiselvitys-notification"
                                                   :notify-before-deadline "6 month"})]
    (when (>= (count notifications) 1)
      (log/info "Sending" (count notifications) "laheta-valiselvityspyynnot notifications")
      (doseq [notification notifications]
        (email/send-laheta-valiselvityspyynnot notification)))))

(defn send-laheta-loppuselvityspyynnot-notifications []
  (let [notifications (get-laheta-selvityspyynnot {:date-field "loppuselvitysdate"
                                                   :status-field "status_loppuselvitys"
                                                   :tapahtumaloki-tyyppi "loppuselvitys-notification"
                                                   :notify-before-deadline "8 month"})]
    (when (>= (count notifications) 1)
      (log/info "Sending" (count notifications) "laheta-loppuselvityspyynnot notifications")
      (doseq [notification notifications]
        (email/send-laheta-loppuselvityspyynnot notification)))))

(defn send-kuukausittainen-tasmaytysraportti [{:keys [force] :or {force false}}]
  (if (and (not force) (tasmaytysraportti/is-last-month-tasmaytysraportti-already-added-to-email-queue?))
    (log/info "Täsmäytysraportti Excel already sent for previous month, skipping")
    (let [raportti (tasmaytysraportti/create-excel-tasmaytysraportti)]
      (log/info "Sending täsmäytysraportti Excel for previous month")
      (email/send-kuukausittainen-tasmaytysraportti raportti))))
