(ns oph.va.virkailija.hakija-api-tools
  (:require [yesql.core :refer [defquery]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.soresu.common.db :refer [exec exec-all]]
            [oph.va.hakija.api :as hakija-api]))

(defquery cancel-all-applications! "sql/spec/hakija/cancel-all-applications.sql")
(defquery set-application-refused! "sql/spec/hakija/set-application-refused.sql")
(defquery create-hakemus "sql/spec/hakija/create-hakemus.sql")
(defquery create-project "sql/spec/hakija/create-project.sql")
(defquery set-all-grants-resolved! "sql/spec/hakija/set-all-grants-resolved.sql")

(defn cancel-all-applications []
  (exec cancel-all-applications! {}))

(defn set-application-refused [user-key form-submission-id comment]
  (let [params {:user_key user-key
                :form_submission_id form-submission-id
                :refused_comment comment}]
    (exec-all [hakija-queries/lock-hakemus params
                        hakija-queries/close-existing-hakemus! params
                        set-application-refused! params])))

(defn set-all-grants-resolved []
  (exec set-all-grants-resolved! {}))
