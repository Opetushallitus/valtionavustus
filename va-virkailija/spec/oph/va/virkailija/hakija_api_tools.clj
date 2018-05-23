(ns oph.va.virkailija.hakija-api-tools
  (:require [yesql.core :refer [defquery]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.soresu.common.db :refer [exec exec-all]]))

(defquery cancel-all-applications! "sql/hakija/hakemus/cancel-all.sql")
(defquery set-application-refused! "sql/hakija/hakemus/set-refused.sql")
(defquery create-hakemus "sql/hakija/hakemus/create.sql")
(defquery create-submission "sql/hakija/hakemus/create-submission.sql")

(defn cancel-all-applications []
  (exec :form-db cancel-all-applications! {}))

(defn set-application-refused [user-key form-submission-id comment]
  (let [params {:user_key user-key
                :form_submission_id form-submission-id
                :refused_comment comment}]
    (exec-all :form-db [hakija-queries/lock-hakemus params
                        hakija-queries/close-existing-hakemus! params
                        set-application-refused! params])))
