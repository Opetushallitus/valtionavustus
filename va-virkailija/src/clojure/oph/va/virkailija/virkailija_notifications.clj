(ns oph.va.virkailija.virkailija-notifications
  (:use [oph.soresu.common.db])
  (:require [clojure.tools.logging :as log]
            [oph.va.virkailija.email :as email]))

(defn- get-loppuselvitys-asiatarkastamatta []
  (query "SELECT h.avustushaku, count(h.id) as hakemus_count, r.email
          FROM hakemukset h
          LEFT JOIN arviot a ON h.id = a.hakemus_id
          LEFT JOIN avustushaku_roles r ON a.presenter_role_id = r.id
          JOIN hakija.avustushaut ah ON ah.id = h.avustushaku
          WHERE h.status_loppuselvitys = 'submitted' AND h.version_closed IS NULL AND r.email IS NOT NULL
          AND ah.created_at > '2020-01-01'::timestamp
          GROUP BY h.avustushaku, r.email"
         []))

(defn- get-hakuaika-paattymassa-haut []
  (query "SELECT h.avustushaku as avustushaku_id, h.user_key, hakemus.contact_email AS contact_email,
            date(avustushaku.content -> 'duration' ->> 'end') AS paattymispaiva
            from hakija.hakemukset h
          JOIN hakija.avustushaut avustushaku
            ON h.avustushaku = avustushaku.id
          JOIN virkailija.normalized_hakemus hakemus
            ON h.id = hakemus.id
          WHERE version_closed IS NULL
          AND hakemus_type = 'hakemus'
          AND date(avustushaku.content -> 'duration' ->> 'end') = date(now() + interval '1 DAY')"
         []))

(defn send-loppuselvitys-asiatarkastamatta-notifications []
  (let [rows    (get-loppuselvitys-asiatarkastamatta)
        grouped (group-by :email rows)]
    (doseq [keyval grouped]
      (email/send-loppuselvitys-asiatarkastamatta [(key keyval)] (val keyval)))))

(defn- get-loppuselvitys-taloustarkastamatta []
  (query "SELECT avustushaku, count(id) as hakemus_count
          FROM hakemukset
          WHERE status_loppuselvitys = 'information_verified' AND version_closed IS NULL
          GROUP BY avustushaku"
         []))

(defn send-loppuselvitys-taloustarkastamatta-notifications []
  (let [loppuselvitys-list (get-loppuselvitys-taloustarkastamatta)]
    (when (>= (count loppuselvitys-list) 1)
      (email/send-loppuselvitys-taloustarkastamatta loppuselvitys-list))))

(defn send-hakuaika-paattymassa-notifications []
  (let [hakemukset-list (get-hakuaika-paattymassa-haut)]
    (when (>= (count hakemukset-list) 1)
      (doseq [hakemus hakemukset-list]
        (email/send-hakuaika-paattymassa hakemus)))))

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
