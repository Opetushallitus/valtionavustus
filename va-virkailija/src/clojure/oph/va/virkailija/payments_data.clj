(ns oph.va.virkailija.payments-data
  (:require
   [oph.soresu.common.db :refer [exec exec-all]]
   [oph.va.virkailija.utils
    :refer [convert-to-dash-keys convert-to-underscore-keys update-some]]
   [clj-time.coerce :as c]
   [clj-time.core :as t]
   [clj-time.format :as f]
   [oph.va.virkailija.db.queries :as queries]
   [oph.va.virkailija.application-data :as application-data]
   [oph.va.virkailija.grant-data :as grant-data]
   [oph.va.virkailija.invoice :as invoice]
   [oph.va.virkailija.email :as email]))

(def date-formatter (f/formatter "dd.MM.YYYY"))

(def system-user
  {:person-oid "System"
   :first-name "Initial"
   :surname "payment"})

(defn from-sql-date [d] (.toLocalDate d))

(defn convert-timestamps-from-sql [p]
  (-> p
      (update-some :create-at c/from-sql-time)
      (update-some :due-date from-sql-date)
      (update-some :invoice-date from-sql-date)
      (update-some :receipt-date from-sql-date)))

(defn valid-for-send-payment? [application]
  (and
    (= (:status application) "accepted")
    (get application :should-pay true)
    (not (get application :refused false))))

(defn valid-for-payment? [application]
  (and
    (valid-for-send-payment? application)
    (application-data/has-no-payments? (:id application))))


(defn get-payment
  ([id]
   (->
    (exec :virkailija-db queries/get-payment {:id id})
    first
    convert-to-dash-keys
    convert-timestamps-from-sql))
  ([id version]
   (->
    (exec :virkailija-db queries/get-payment-version {:id id :version version})
    first
    convert-to-dash-keys
    convert-timestamps-from-sql)))

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
             (vector queries/payment-close-version
                     {:id (:id payment-data) :version (:version payment-data)}
                     queries/update-payment)
             (exec-all :virkailija-db)
             first
             convert-to-dash-keys
             convert-timestamps-from-sql)]
    result))

(defn- store-payment [payment]
  (exec :virkailija-db queries/create-payment payment))

(defn- total-paid [application-id]
  (or
    (->
      (exec :virkailija-db queries/get-total-paid {:application_id application-id})
      first
      :total_paid)
    0))

(defn create-payment [payment-data identity]
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

(defn find-payments-by-response [values]
  "Response values: {:register-number \"string\" :invoice-date \"string\"}"
  (let [application
        (application-data/find-application-by-register-number
              (:register-number values))]
    (map
      convert-to-dash-keys
      (exec :virkailija-db
            queries/find-payments-by-application-id-and-invoice-date
            {:application_id (:id application)
             :invoice_date (:invoice-date values)}))))

(defn update-state-by-response [xml]
  (let [response-values (invoice/read-response-xml xml)
        payments (find-payments-by-response response-values)
        payment (first payments)]
    (cond (empty? payments)
          (throw (ex-info "No payments found!" {:cause "no-payment" :error-message (format "No payment found with values: %s" response-values) }))
          (> (count payments) 1)
          (throw (ex-info "Multiple payments found" {:cause "multiple-payments" :error-message (format
                                                     "Multiple payments found with the same register
                                                      number and invoice date: %s" response-values)}))
          (= (:state payment) 3)
          (throw (ex-info "Payment already paid" {:cause "already-paid" :error-message (format "Payment (id %d) is already paid."
                                                                (:id payment))}))
          (not= (:state payment) 2)
          (throw (ex-info
                   "State not valid" {:cause "state-not-valid" :error-message (format "Payment (id %d) is not sent to Rondo or it's state
                                    (%d) is not valid. It should be 2 in this stage."
                                   (:id payment) (:state payment))})))
    (update-payment (assoc payment :state 3)
                    {:person-oid "-" :first-name "Rondo" :surname ""})))

(defn get-valid-grant-payments [id]
  (->>
    (application-data/get-applications-with-evaluation-by-grant id)
    (filter valid-for-send-payment?)
    (reduce
      (fn [p n] (into p (application-data/get-application-payments (:id n)))) [])
    (map convert-timestamps-from-sql)))

(defn delete-grant-payments [id]
  (exec :virkailija-db queries/delete-grant-payments {:id id}))

(defn delete-payment [id]
  (exec :virkailija-db queries/delete-payment {:id id}))

(defn get-batch-payments-info [batch-id]
  (convert-to-dash-keys
    (first (exec :virkailija-db queries/get-grant-payments-info
                 {:batch_id batch-id}))))

(defn format-email-date [date]
  (f/unparse date-formatter date))

(defn create-payments-email
  [{:keys [batch-id inspector-email acceptor-email receipt-date
           grant-id organisation batch-number]}]
  (let [grant (grant-data/get-grant grant-id)
        now (t/now)
        receipt-year (mod (.getYear receipt-date) 100)
        payments-info (get-batch-payments-info batch-id)
        batch-key (invoice/get-batch-key
                    organisation receipt-year batch-number)]

    {:receivers [inspector-email acceptor-email]
     :batch-key batch-key
     :title (get-in grant [:content :name])
     :date (format-email-date now)
     :count (:count payments-info)
     :total-granted (:total-granted payments-info)}))

(defn send-payments-email [data]
  (email/send-payments-info! (create-payments-email data)))

(defn get-first-payment-sum [application grant]
  (int
    (if (and
          (get-in grant [:content :multiplemaksuera] false)
             (or (= (get-in grant [:content :payment-size-limit] "no-limit")
                    "no-limit")
                 (>= (:budget-granted application)
                     (get-in grant [:content :payment-fixed-limit]))))
      (* (/ (get-in grant [:content :payment-min-first-batch] 60) 100.0)
         (:budget-granted application))
      (:budget-granted application))))

(defn create-payment-values [application sum phase]
  {:application-id (:id application)
   :application-version (:version application)
   :state 0
   :batch-id nil
   :payment-sum sum
   :phase phase})

(defn create-grant-payments
  ([grant-id phase identity]
   (let [grant (grant-data/get-grant grant-id)]
     (doall
       (map
         #(create-payment
            (create-payment-values % (get-first-payment-sum % grant) phase)
            identity)
         (filter
           valid-for-payment?
           (application-data/get-applications-with-evaluation-by-grant
             grant-id))))))
  ([grant-id phase] (create-grant-payments grant-id phase system-user)))
