(ns oph.va.admin-ui.payments.payments
  (:require [oph.va.admin-ui.payments.utils :refer [no-nils? valid-email?]]
            [oph.va.admin-ui.utils :refer [format get-answer-value]]
            [cljs-time.coerce :as tc]
            [cljs-time.format :as tf]))

(defn valid-batch-values?
  [values]
  (and (no-nils? values
                 [:due-date :invoice-date :receipt-date])
       (valid-email? (:inspector-email values))
       (valid-email? (:acceptor-email values))))

(defn any-account-nil? [a]
  (some?
    (some #(when-not (and (some? (get % :lkp-account))
                          (some? (get % :takp-account))) %) a)))

(defn get-batch-values [batch]
  (assoc
    (select-keys batch
                 [:acceptor-email
                  :inspector-email
                  :batch-number
                  :receipt-date])
    :state 0
    :batch-id (:id batch)))

(defn- batch-payable? [pred applications]
  (and
    (not (empty? applications))
    (true?
      (some
        pred
        applications))))

(defn multibatch-payable? [applications]
  (batch-payable?
    (fn [application]
      (some (fn [payment] (= (:state payment) 1))
            (:payments application)))
    applications))

(defn- format-date [d]
  (when (some? d)
   (format "%04d-%02d-%02d"
           (.getFullYear d)
           (+ (.getMonth d) 1 )
           (.getDate d))))

(defn convert-payment-dates [values]
  (-> values
      (update :due-date format-date)
      (update :receipt-date format-date)
      (update :invoice-date format-date)))

(defn- parse-date [s]
  (-> s
      tf/parse
      tc/to-date))

(defn parse-batch-dates [batch]
  (-> batch
      (update :due-date parse-date)
      (update :receipt-date parse-date)
      (update :invoice-date parse-date)))

(def ^:private error-messages
  {"timeout" "Rondo-yhteydessä onglemia"
   "already-paid" "Maksatukset on jo lähetetty"
   "exception" "Palvelinvirhe"})

(defn get-error-messages [errors default-value]
  (map #(get error-messages % default-value) errors))

(defn- convert-application-payments [application payments]
  (let [application-info
        (assoc
          (select-keys
             application
             [:project-name :organization-name :register-number
              :takp-account :lkp-account :budget-oph-share :grant-id])
          :bank-iban (get-answer-value (:answers application) "bank-iban"))]
    (map
      #(merge application-info %)
      payments)))

(defn- find-application-payments [payments application-id application-version]
  (filter #(and (= (:application-version %) application-version)
                (= (:application-id %) application-id))
          payments))

(defn combine [applications payments]
  (reduce
    (fn [p n]
      (into p
            (let [application-payments
                  (find-application-payments
                    payments (:id n) (:version n))]
              (convert-application-payments n application-payments))))
    []
    applications))
