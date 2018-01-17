(ns oph.va.virkailija.grant-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db.queries :as virkailija-queries]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [oph.va.virkailija.invoice :refer [get-installment]]
            [oph.va.virkailija.email :as email]
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

(defn get-grant-applications-with-evaluation [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grant-applications-with-evaluation
              {:grant_id grant-id})))

(defn get-grant-applications [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grant-applications
              {:grant_id grant-id})))

(defn get-grant-payments [id]
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grant-payments {:id id})))

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

(defn send-payments-email [{:keys [installment receivers grant-id]}]
  (when (not= (count installment) 9) (throw (Exception. "Invalid installment")))

  (let [grant (convert-to-dash-keys
                (first (exec :form-db virkailija-queries/get-grant
                             {:grant_id grant-id})))
        installment-number (parse-installment-number installment)
        payments-info (get-grant-payments-info grant-id installment-number)]

    (email/send-payments-info!
      {:receivers receivers
       :installment installment
       :title (get-in grant [:content :name])
       :date (f/unparse date-formatter (t/now))
       :count (:count payments-info)
       :total-granted (:total-granted payments-info)})))
