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
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.rondo-service :refer :all]
            [oph.va.virkailija.remote-file-service :refer :all]
            [oph.va.virkailija.invoice :as invoice]
            [clj-time.core :as t]
            [clj-time.format :as f]
            [oph.va.virkailija.email :as email])
  (:import [oph.va.virkailija.rondo_service RondoFileService]))

(def date-formatter (f/formatter "dd.MM.YYYY"))

(def timeout-limit 10000)

(defn find-batches [date grant-id]
  (->> (exec queries/find-batches
             {:batch_date date :grant_id grant-id})
      (map convert-to-dash-keys)
      (map convert-timestamps-from-sql)))

(defn create-batch [values]
  (->> values
       convert-to-underscore-keys
       (exec queries/create-batch)
       first
       convert-to-dash-keys
       convert-timestamps-from-sql))

(defn get-batch [id]
  (-> (exec queries/get-batch {:batch_id id})
      first
      convert-to-dash-keys
      convert-timestamps-from-sql))

(defn create-filename
  ([payment id-gen-fn] (format "payment-%d-%d.xml" (:id payment) (id-gen-fn)))
  ([payment] (create-filename payment  #(System/currentTimeMillis))))

(defn send-to-rondo! [payment application grant filename batch]
  (let [rondo-service (rondo-service/create-service
                        (get-in config [:server :rondo-sftp]))]
  (with-timeout
    #(try
       (send-payment-to-rondo! rondo-service
         {:payment (payments-data/get-payment (:id payment))
          :application application
          :grant grant
          :filename filename
          :batch batch})
       (catch Exception e
         {:success false :error {:error-type :exception :exception e}}))
    timeout-limit {:success false :error {:error-type :timeout}})))

(defn send-payment [payment application data]
  (let [filename (create-filename payment)
        updated-payment (payments-data/update-payment
                          (assoc payment :batch-id (get-in data [:batch :id]))
                          (:identity data))]
    (-> updated-payment
        (send-to-rondo! application (:grant data) filename (:batch data))
        (assoc :filename filename :payment updated-payment))))

(defn send-payments [data]
  (let [{:keys [identity grant]} data
        c (a/chan)]
    (a/go
      (doseq [application
              (filter
                payments-data/valid-for-send-payment?
                (grant-data/get-grant-applications-with-evaluation
                  (:id grant)))]
        (let [payments (application-data/get-application-unsent-payments
                         (:id application))]
          (if (empty? payments)
            {:success false :error {:error-type :no-payments}}
            (doseq [payment payments]
              (let [result (send-payment payment application data)]
                (when (:success result)
                  (payments-data/update-payment
                    (assoc (:payment result)
                           :paymentstatus-id "sent" :filename (:filename result)) identity)
                  (application-data/revoke-application-tokens
                    (:id application)))
                (a/>! c result))))))
      (a/close! c))
    c))

(defn set-payments-paid [{:keys [identity grant-id]}]
  (doseq [application
          (filter
            payments-data/valid-for-send-payment?
            (grant-data/get-grant-applications-with-evaluation grant-id))]
    (doseq [payment
            (application-data/get-application-unsent-payments
              (:id application))]
      (payments-data/update-payment
        (assoc payment :paymentstatus-id "paid" :filename "") identity)
      (application-data/revoke-application-tokens
        (:id application)))))

(defn get-batch-documents [batch-id]
  (->> (exec queries/get-batch-documents {:batch_id batch-id})
      (map convert-to-dash-keys)
      (map convert-timestamps-from-sql)))

(defn create-batch-document [batch-id document]
  (->> (assoc document :batch-id batch-id)
       convert-to-underscore-keys
       (exec queries/create-batch-document)
       first
       convert-to-dash-keys))

(defn create-batch-document-email
  [{:keys [grant batch document payments]}]
  {:receivers [(:presenter-email document) (:acceptor-email document)]
   :batch-key (invoice/get-batch-key batch grant)
   :title (get-in grant [:content :name])
   :date (f/unparse date-formatter (t/now))
   :count (count payments)
   :total-granted (reduce #(+ %1 (:payment-sum %2)) 0 payments)})

(defn send-batch-emails [batch-id]
  (let [batch (get-batch batch-id)
        grant (grant-data/get-grant (:grant-id batch))
        payments (payments-data/get-batch-payments batch-id)]
    (doseq [document (get-batch-documents batch-id)]
      (email/send-payments-info!
        (create-batch-document-email
          {:grant grant
           :batch batch
           :document document
           :payments (filter
                       #(= (:phase %) (:phase document))
                       payments)})))))

(defn- set-batch-documents [batch]
  (assoc batch :documents (get-batch-documents (:id batch))))

(defn get-grant-batches [grant-id]
  (->> (exec queries/get-grant-batches {:grant_id grant-id})
       (map convert-to-dash-keys)
       (map convert-timestamps-from-sql)
       (map set-batch-documents)))
