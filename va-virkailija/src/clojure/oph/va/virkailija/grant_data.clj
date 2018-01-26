(ns oph.va.virkailija.grant-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db.queries :as virkailija-queries]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys update-some]]
            [oph.va.virkailija.invoice :refer [get-installment]]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.lkp-templates :as lkp]
            [clj-time.coerce :as c]
            [clj-time.core :as t]
            [clj-time.format :as f]))

(def date-formatter (f/formatter "dd.MM.YYYY"))

(defn get-grants []
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grants {})))

(defn get-resolved-grants-with-content []
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-resolved-grants-with-content {})))

(defn get-grant [grant-id]
  (convert-to-dash-keys
   (first (exec :form-db virkailija-queries/get-grant {:grant_id grant-id}))))

(defn- set-lkp-account [application]
  (assoc application :lkp-account (lkp/get-lkp-account (:answers application))))

(defn get-grant-applications-with-evaluation [grant-id]
  (->> (exec :form-db
             virkailija-queries/get-grant-applications-with-evaluation
             {:grant_id grant-id} )
      (map convert-to-dash-keys)
      (mapv set-lkp-account)))

(defn get-grant-applications [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grant-applications
              {:grant_id grant-id})))

(defn from-sql-date [d]
  (.toLocalDate d))

(defn- convert-dates [p]
  (-> p
      (update-some :create-at c/from-sql-time)
      (update-some :due-date from-sql-date)
      (update-some :invoice-date from-sql-date)
      (update-some :receipt-date from-sql-date)))

(defn get-grant-payments [id]
  (->> (exec :form-db virkailija-queries/get-grant-payments {:id id})
       (mapv convert-to-dash-keys)
       (mapv convert-dates)))

(defn delete-grant-payments [id]
  (exec :form-db virkailija-queries/delete-grant-payments {:id id}))

(defn parse-installment-number [s]
  (-> s
      (subs 6)
      (Integer/parseInt)))

(defn get-grant-payments-info [id installment-number]
  (convert-to-dash-keys
    (first (exec :form-db virkailija-queries/get-grant-payments-info
                 {:grant_id id :installment_number installment-number}))))

(defn send-payments-email
  [{:keys [installment-number inspector-email acceptor-email
           grant-id organisation]}]
  (when (not (integer? installment-number)) (throw (Exception. "Invalid installment number")))

  (let [grant (convert-to-dash-keys
                (first (exec :form-db virkailija-queries/get-grant
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
