(ns oph.va.virkailija.payment-batches-data
  (:require [clojure.core.async :as a]
            [oph.soresu.common.db :refer [named-query query-original-identifiers]]
            [clojure.tools.logging :as log]
            [clojure.core.async :refer [<!!]]
            [oph.va.virkailija.utils
             :refer [convert-to-dash-keys convert-to-underscore-keys
                     with-timeout]]
            [oph.va.virkailija.application-data :as application-data]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.remote-file-service :refer [send-payment-to-rondo!]]
            [oph.va.virkailija.invoice :as invoice]
            [clj-time.core :as t]
            [clj-time.format :as f]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.utils :refer [either?]]
            [oph.va.virkailija.authentication :as authentication]))

(def date-formatter (f/formatter "dd.MM.YYYY"))

(def timeout-limit 10000)

(defn find-batches [grant-id]
  (->> (query-original-identifiers
        "SELECT id, created_at, batch_number, invoice_date, due_date,
                receipt_date, currency, partner, grant_id
         FROM virkailija.payment_batches
         WHERE created_at >= TIMESTAMP 'today' AND grant_id = ?
         ORDER BY id DESC"
        [grant-id])
       (map convert-to-dash-keys)
       (map payments-data/convert-timestamps-from-sql)))

(defn create-batch [values]
  (->> values
       convert-to-underscore-keys
       (named-query
        "INSERT INTO virkailija.payment_batches
           (batch_number, invoice_date, due_date, receipt_date, currency, partner, grant_id)
         VALUES
           ((SELECT GREATEST(MAX(batch_number), 0) + 1
             FROM virkailija.payment_batches
             WHERE date_part('year', created_at) = date_part('year', CURRENT_DATE)),
            :invoice_date, :due_date, :receipt_date, :currency, :partner, :grant_id)
         RETURNING id, batch_number, invoice_date, due_date, receipt_date,
                   currency, partner, grant_id")
       first
       convert-to-dash-keys
       payments-data/convert-timestamps-from-sql))

(defn get-batch [id]
  (-> (query-original-identifiers
       "SELECT id, created_at, batch_number, invoice_date, due_date,
               receipt_date, currency, partner, grant_id
        FROM virkailija.payment_batches WHERE id = ?"
       [id])
      first
      convert-to-dash-keys
      payments-data/convert-timestamps-from-sql))

(defn create-filename
  ([payment id-gen-fn] (format "payment-%d-%d.xml" (:id payment) (id-gen-fn)))
  ([payment] (create-filename payment  #(System/currentTimeMillis))))

(defn send-to-rondo! [payment application grant filename batch]
  (let [rondo-service (rondo-service/create-service
                       (get-in config [:server :payment-service-sftp]))]
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
        projectCode (or (:project-code payment) (:project-code application))
        updated-payment (payments-data/update-payment
                         (assoc payment :batch-id (get-in data [:batch :id])
                                :project-code projectCode)
                         (:identity data))]
    (-> updated-payment
        (send-to-rondo! application (:grant data) filename (:batch data))
        (assoc
         :filename filename
         :payment (payments-data/get-payment (:id updated-payment) (:version updated-payment))))))

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
  (->> (query-original-identifiers
        "SELECT id, created_at, document_id, phase, presenter_email, acceptor_email
         FROM virkailija.batch_documents
         WHERE batch_id = ? AND deleted IS NOT TRUE"
        [batch-id])
       (map convert-to-dash-keys)
       (map payments-data/convert-timestamps-from-sql)))

(defn create-batch-document [batch-id document]
  (->> (assoc document :batch-id batch-id)
       convert-to-underscore-keys
       (named-query
        "INSERT INTO virkailija.batch_documents
           (batch_id, document_id, phase, presenter_email, acceptor_email)
         VALUES (:batch_id, :document_id, :phase, :presenter_email, :acceptor_email)
         RETURNING id, created_at, document_id, phase, presenter_email, acceptor_email")
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
  (->> (query-original-identifiers
        "SELECT id, created_at, batch_number, invoice_date, due_date,
                receipt_date, currency, partner, grant_id
         FROM virkailija.payment_batches WHERE grant_id = ?"
        [grant-id])
       (map convert-to-dash-keys)
       (map payments-data/convert-timestamps-from-sql)
       (map set-batch-documents)))

(defn send-payments-with-id [batch-id request]
  (let [batch (assoc
               (get-batch batch-id)
               :documents (get-batch-documents batch-id))
        c (send-payments
           {:batch batch
            :grant (grant-data/get-grant (:grant-id batch))
            :identity (authentication/get-request-identity request)})]
    (let [result
          (loop [total-result {:count 0 :error-count 0 :errors '()}]
            (if-let [r (<!! c)]
              (if (or (:success r)
                      (either? (get-in r [:error :error-type])
                               #{:already-paid :no-payments}))
                (recur (update total-result :count inc))
                (do (when (= (get-in r [:error :error-type]) :exception)
                      (log/error (get-in r [:error :exception])))
                    (recur (-> total-result
                               (update :count inc)
                               (update :error-count inc)
                               (update :errors conj (:error r))))))
              total-result))]
      {:success
       (and (= (:error-count result) 0) (> (:count result) 0))
       :errors (map :error-type (:errors result))})))

