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

(defn send-loppuselvitys-asiatarkastamatta-notifications []
  (let [rows    (get-loppuselvitys-asiatarkastamatta)
        grouped (group-by :email rows)]
    (doseq [keyval grouped]
      (email/send-loppuselvitys-asiatarkastamatta [(key keyval)] (val keyval)))))
