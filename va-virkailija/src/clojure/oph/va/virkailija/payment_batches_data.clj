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

(defn create-filename [payment]
  (format "payment-%d-%d.xml" (:id payment) (System/currentTimeMillis)))

(defn send-to-rondo! [payment application grant filename]
  (with-timeout
    #(try
       (rondo-service/send-to-rondo!
         {:payment (payments-data/get-payment (:id payment))
          :application application
          :grant grant
          :filename filename})
       (catch Exception e
         {:success false :error-type :exception :exception e}))
    timeout-limit {:success false :error-type :timeout}))

(defn get-unpaid-payment [payments]
  (some #(when (< (:state %) 2) %) payments))

(defn create-multibatch-payment [application data]
  (let [payments (application-data/get-application-payments (:id application))]
    (cond (and (every? #(> (:state %) 1) payments)
               (>= (reduce #(+ %1 (:sum %2)) 0 payments)
                   (:budget-granted application)))
          {:success false :error-type :already-paid}
          (get-unpaid-payment payments)
          (let [payment (get-unpaid-payment payments)
                filename (create-filename payment)]
            (assoc
              (send-to-rondo! payment application (:grant data) filename)
              :filename filename :payment payment))
          :else {:success false :error-type :unknown-payment})))

(defn create-single-batch-payment [application data]
  (let [payments (application-data/get-application-payments (:id application))]
    (if (or (empty? payments) (< (:state (first payments)) 2))
      (let [payment
            (or (first payments)
                (payments-data/create-payment
                  (assoc
                    (create-payment-values
                     application (:batch data))
                    :payment-sum (:budget-granted application))
                  (:identity data)))
            filename (create-filename payment)]
        (assoc (send-to-rondo! payment application (:grant data) filename)
               :filename filename :payment payment))
      {:success false :error-type :already-paid})))

(defn create-payments [data]
  (let [{:keys [identity batch grant]} data
        c (a/chan)]
    (a/go
      (doseq [application
              (grant-data/get-grant-applications-with-evaluation (:id grant))]
        (let [result
              (if (get-in grant [:content :multiplemaksuera])
                (create-multibatch-payment application data)
                (create-single-batch-payment application data))]
          (cond
            (:success result)
            (payments-data/update-payment
              (assoc (:payment result)
                     :state 2 :filename (:filename result)) identity)
            (not= (:error-type result) :already-paid)
              (a/>! c (:error-type result)))))
      (a/close! c))
    c))
