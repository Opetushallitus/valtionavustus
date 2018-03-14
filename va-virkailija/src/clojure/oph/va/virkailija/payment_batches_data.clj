(ns oph.va.virkailija.payment-batches-data
  (:require [clojure.core.async :as a]
            [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db.queries :as queries]
            [oph.va.virkailija.utils
             :refer [convert-to-dash-keys convert-to-underscore-keys
                     with-timeout]]
            [oph.va.virkailija.payments-data
             :refer [convert-timestamps-from-sql]]
            [oph.va.virkailija.application-data :as application-data]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.grant-data :as grant-data]))
(def timeout-limit 10000)

(defn find-batch [date grant-id]
  (-> (exec :form-db queries/find-batch {:batch_date date :grant_id grant-id})
      first
      convert-to-dash-keys
      convert-timestamps-from-sql))

(defn create-batch [values]
  (->> values
       convert-to-underscore-keys
       (exec :form-db queries/create-batch)
       first
       convert-to-dash-keys
       convert-timestamps-from-sql))

(defn get-batch [id]
  (-> (exec :form-db queries/get-batch {:batch_id id})
      first
      convert-to-dash-keys
      convert-timestamps-from-sql))

(defn create-payment-values [application batch]
  {:application-id (:id application)
   :application-version (:version application)
   :state 0
   :batch-id (:id batch)})

(defn create-payments [{:keys [identity batch grant]}]
  (let [c (a/chan)]
    (a/go
      (let [applications (grant-data/get-unpaid-applications (:id grant))]
        (a/go
          (doseq [application applications]
            (let [payment
                  (or (application-data/get-application-payment
                        (:id application))
                      (payments-data/create-payment
                        (create-payment-values application batch) identity))
                  filename (format "payment-%d-%d.xml"
                                   (:id payment) (System/currentTimeMillis))]
              (let [result
                    (with-timeout
                      #(try
                         (rondo-service/send-to-rondo!
                           {:payment (payments-data/get-payment (:id payment))
                            :application application
                            :grant grant
                            :filename filename})
                         (catch Exception e
                           {:success false :error-type :exception :exception e}))
                      timeout-limit
                      {:success false :error-type :timeout})]
                (if (:success result)
                  (payments-data/update-payment
                    (assoc payment :state 2 :filename filename) identity)
                  (a/>! c (:error-type result))))))
          (a/close! c))))
    c))
