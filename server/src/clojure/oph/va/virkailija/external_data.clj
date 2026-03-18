(ns oph.va.virkailija.external-data
  (:require [oph.soresu.common.db :as db]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [clj-time.core :as t]
            [oph.common.datetime :as datetime]))

(defmulti avustushaku-phase (fn [avustushaku] [(:status avustushaku)
                                               (t/after? (datetime/now) (datetime/parse (:start (:duration (:content avustushaku)))))
                                               (t/before? (datetime/now) (datetime/parse (:end (:duration (:content avustushaku)))))]))

(defmethod avustushaku-phase ["published" true true]  [_] "current")
(defmethod avustushaku-phase ["published" true false] [_] "ended")
(defmethod avustushaku-phase ["published" false true] [_] "upcoming")
(defmethod avustushaku-phase ["resolved" true false] [_] "ended")
(defmethod avustushaku-phase :default  [_] "unpublished")

(defn add-phase [avustushaku]
  (merge {:phase  (avustushaku-phase avustushaku)} avustushaku))

(defn get-grants-for-year [year]
  (let [rows (db/query-original-identifiers
              "SELECT
  h.id, h.created_at, h.form, h.content, h.status, h.register_number,
  h.valiselvitysdate, h.loppuselvitysdate, h.form_loppuselvitys,
  h.form_valiselvitys, h.is_academysize, h.haku_type, h.operational_unit_id,
  h.hankkeen_alkamispaiva, h.hankkeen_paattymispaiva,
  null as project_id, (h.decision->>'valmistelija')::jsonb as valmistelija
FROM
  hakija.avustushaut h
WHERE
  h.status != 'deleted' AND
  h.allow_visibility_in_external_system = true AND
  (
    date_part('year', (h.content#>>'{duration,start}')::timestamp) <= ?
    AND
    date_part('year', (h.content#>>'{duration,end}')::timestamp) >= ?
  )
ORDER BY h.created_at DESC"
              [year year])]
    (map add-phase (map convert-to-dash-keys rows))))

(defn get-applications-by-grant-id [grant-id]
  (let [rows (db/query-original-identifiers
              "SELECT
  h.id, h.language, h.avustushaku as grant_id, h.organization_name, h.project_name,
  h.user_first_name, h.user_last_name,
  coalesce(project_goals.value, project_nutshell.value) as nutshell,
  partners.value as partners,
  project_begin.value as project_begin,
  project_end.value as project_end,
  a.budget_granted, a.costs_granted
FROM
  hakija.hakemukset h
JOIN
  virkailija.arviot a
  ON a.hakemus_id = h.id
LEFT JOIN
  (
    SELECT id, version, elem->>'value' as value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'project-goals'
  ) AS project_goals ON (h.form_submission_id = project_goals.id AND h.form_submission_version = project_goals.version)
LEFT JOIN
  (
    SELECT id, version, elem->>'value' as value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'project-nutshell'
  ) AS project_nutshell ON (h.form_submission_id = project_nutshell.id AND h.form_submission_version = project_nutshell.version)
LEFT JOIN
  (
    SELECT id, version, elem->>'value' AS value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'other-partners'
  ) AS partners ON (h.form_submission_id = partners.id AND h.form_submission_version = partners.version)
LEFT JOIN
  (
    SELECT id, version, elem->>'value' AS value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'project-begin'
  ) AS project_begin ON (h.form_submission_id = project_begin.id AND h.form_submission_version = project_begin.version)
LEFT JOIN
  (
    SELECT id, version, elem->>'value' AS value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'project-end'
  ) AS project_end ON (h.form_submission_id = project_end.id AND h.form_submission_version = project_end.version)
LEFT JOIN
  hakija.avustushaut ah ON h.avustushaku = ah.id
WHERE
  h.avustushaku = ?
  AND h.hakemus_type = 'hakemus'
  AND h.version_closed IS NULL
  AND a.status = 'accepted'
  AND a.allow_visibility_in_external_system = true
  AND ah.allow_visibility_in_external_system = true
ORDER BY
  h.id ASC"
              [grant-id])]
    (map convert-to-dash-keys rows)))
