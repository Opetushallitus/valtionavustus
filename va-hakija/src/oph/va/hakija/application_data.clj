(ns oph.va.hakija.application-data
  (:require [oph.va.hakija.db :as va-db]))

(defn create-application-token [user-key]
  (let [application (va-db/get-hakemus user-key)]
    (:token (va-db/create-application-token (:id application)))))
