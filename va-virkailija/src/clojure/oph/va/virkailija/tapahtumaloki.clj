(ns oph.va.virkailija.tapahtumaloki
(:require
  [oph.soresu.common.db :refer [exec exec-all]]
  [oph.va.virkailija.utils :refer [convert-to-dash-keys convert-to-underscore-keys]]
  [oph.va.virkailija.payments-data :refer [get-user-info]]
  [clojure.tools.logging :as log]
  [oph.va.virkailija.db.queries :as queries]))

(defn- store-log-entry [entry]
       (exec :virkailija-db queries/create-tapahtumaloki-entry entry))

(defn- create-log-entry [tyyppi avustushaku-id identity]
      (log/info (str "Creating log entry " tyyppi " for " avustushaku-id ))
      (store-log-entry
        (merge (convert-to-underscore-keys (get-user-info identity)) {:tyyppi tyyppi :avustushaku_id avustushaku-id})))

(defn create-paatoksen-lahetys-entry [avustushaku-id identity]
      (create-log-entry "paatoksen_lahetys" avustushaku-id identity))

(defn- get-tapahtumaloki-entries [tyyppi avustushaku-id]
  (exec :virkailija-db
        queries/get-tapahtumaloki-entries
        {:tyyppi tyyppi :avustushaku_id avustushaku-id}))

(defn get-paatoksen-lahetys-entries [avustushaku-id]
  (get-tapahtumaloki-entries "paatoksen_lahetys" avustushaku-id))
