(ns oph.va.virkailija.payments-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.virkailija.utils
    :refer [convert-to-dash-keys convert-to-underscore-keys update-some]]
   [clj-time.coerce :as c]
   [clj-time.core :as t]
   [clj-time.format :as f]
   [oph.va.virkailija.db.queries :as queries]
   [oph.va.virkailija.application-data :as application-data]
   [oph.va.virkailija.invoice :as invoice]
   [oph.va.virkailija.email :as email]
   [oph.va.virkailija.invoice :refer [get-installment]]))

(def date-formatter (f/formatter "dd.MM.YYYY"))

(defn- get-keys-present [m ks]
  (keys (select-keys m ks)))

(defn from-sql-date [d] (.toLocalDate d))

(defn convert-timestamps-from-sql [p]
  (-> p
      (update-some :create-at c/from-sql-time)
      (update-some :due-date from-sql-date)
      (update-some :invoice-date from-sql-date)
      (update-some :receipt-date from-sql-date)))

(defn get-payment
  ([id]
   (->
    (exec :form-db queries/get-payment {:id id})
    first
    convert-to-dash-keys
    convert-timestamps-from-sql))
  ([id version]
   (->
    (exec :form-db queries/get-payment-version {:id id :version version})
    first
    convert-to-dash-keys
    convert-timestamps-from-sql)))

(defn close-version [id version]
  (exec :form-db queries/payment-close-version
        {:id id :version version}))

(defn next-installment-number []
  (convert-to-dash-keys
    (first (exec :form-db queries/get-next-payment-installment-number {}))))

(defn- get-user-info [identity]
  {:user-oid (:person-oid identity)
   :user-name (format "%s %s" (:first-name identity) (:surname identity))})

(defn update-payment [payment-data identity]
  (let [old-payment (get-payment (:id payment-data) (:version payment-data))
        payment (dissoc (merge old-payment payment-data (get-user-info identity))
                        :version :version-closed)
        result
        (->> payment
             convert-to-underscore-keys
             (exec :form-db queries/update-payment)
             first
             convert-to-dash-keys
             convert-timestamps-from-sql)]
    (when (nil? result) (throw (Exception. "Failed to update payment")))
    (close-version (:id payment-data) (:version payment-data))
    result))

(defn- store-payment [payment]
  (exec :form-db queries/create-payment payment))

(defn create-payment [payment-data identity]
  (when
   (not
    (empty?
     (exec :form-db queries/get-application-payments
           {:application_id (:application-id payment-data)})))
    (throw
     (Exception. "Application already contains a payment")))
  (let [application (application-data/get-application
                     (:application-id payment-data))]
    (-> payment-data
        (assoc :application-version (:version application)
               :grant-id (:grant-id application))
        (merge (get-user-info identity))
        convert-to-underscore-keys
        store-payment
        first
        convert-to-dash-keys
        convert-timestamps-from-sql)))

(defn get-by-rn-and-date [values]
  (->> values
       convert-to-underscore-keys
       (exec :form-db queries/get-by-rn-and-date)
       (map convert-to-dash-keys)))

(defn update-state-by-response [xml]
  (let [response-values (invoice/read-response-xml xml)
        payments (get-by-rn-and-date response-values)
        payment (first payments)]
    (cond (empty? payments)
          (throw (Exception. (format "No payment found with values: %s"
                                     response-values)))
          (> (count payments) 1)
          (throw (Exception. (format
                               "Multiple payments found with the same register
                                number and invoice date: %s" response-values)))
          (= (:state payment) 3)
          (throw (Exception. (format "Payment (id %d) is already paid."
                                     (:id payment))))
          (not= (:state payment) 2)
          (throw (Exception.
                   (format "Payment (id %d) is not sent to Rondo or it's state
                            (%d) is not valid. It should be 2 in this stage."
                           (:id payment) (:state payment)))))
    (update-payment (assoc payment :state 3)
                    {:person-oid "-" :first-name "Rondo" :surname ""})))

(defn get-grant-payments [id]
  (->> (exec :form-db queries/get-grant-payments {:id id})
       (mapv convert-to-dash-keys)
       (mapv convert-timestamps-from-sql)))

(defn delete-grant-payments [id]
  (exec :form-db queries/delete-grant-payments {:id id}))

(defn parse-installment-number [s]
  (-> s
      (subs 6)
      (Integer/parseInt)))

(defn get-grant-payments-info [id installment-number]
  (convert-to-dash-keys
    (first (exec :form-db queries/get-grant-payments-info
                 {:grant_id id :installment_number installment-number}))))

(defn send-payments-email
  [{:keys [installment-number inspector-email acceptor-email
           grant-id organisation]}]
  (when (not (integer? installment-number)) (throw (Exception. "Invalid installment number")))

  (let [grant (convert-to-dash-keys
                (first (exec :form-db queries/get-grant
                             {:grant_id grant-id})))
        now (t/now)
        payments-info (get-grant-payments-info grant-id installment-number)
        installment (get-installment
                      organisation
                      (t/year now)
                      installment-number)]

    (email/send-payments-info!
      {:receivers [inspector-email acceptor-email]
       :installment installment
       :title (get-in grant [:content :name])
       :date (f/unparse date-formatter now)
       :count (:count payments-info)
       :total-granted (:total-granted payments-info)})))
