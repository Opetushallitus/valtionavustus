(ns oph.va.virkailija.tapahtumaloki
    (:require
      [oph.soresu.common.db :refer [exec exec-all]]
      [oph.va.virkailija.utils :refer [convert-to-dash-keys convert-to-underscore-keys]]
      [oph.va.virkailija.payments-data :refer [get-user-info]]
      [clojure.tools.logging :as log]
      [oph.va.virkailija.db.queries :as queries]))

(defn- store-log-entry [entry]
       (exec queries/create-tapahtumaloki-entry entry))

(defn- create-log-entry [tyyppi avustushaku-id hakemus-id identity batch-id emails success]
       (log/info (str "Creating log entry " tyyppi " for " avustushaku-id))
       (store-log-entry
         (merge (convert-to-underscore-keys (get-user-info identity))
                {:tyyppi         tyyppi
                 :avustushaku_id avustushaku-id
                 :hakemus_id     hakemus-id
                 :batch_id       batch-id
                 :emails         {:addresses emails}
                 :success        success})))

(defn create-paatoksen-lahetys-entry [avustushaku-id hakemus-id identity batch-id emails success]
      (create-log-entry "paatoksen_lahetys" avustushaku-id hakemus-id identity batch-id emails success))

(defn- get-tapahtumaloki-entries [tyyppi avustushaku-id]
       (exec queries/get-tapahtumaloki-entries
             {:tyyppi tyyppi :avustushaku_id avustushaku-id}))

(defn get-paatoksen-lahetys-entries [avustushaku-id]
      (get-tapahtumaloki-entries "paatoksen_lahetys" avustushaku-id))
