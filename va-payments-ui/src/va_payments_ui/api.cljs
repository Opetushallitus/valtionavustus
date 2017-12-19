(ns va-payments-ui.api
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [cljs.core.async :as async]
   [va-payments-ui.connection :as connection]))

(defn request-with-go [f on-success on-error]
  (go
    (let [response (async/<! (f))]
      (if (:success response)
        (on-success (:body response))
        (on-error (:status response) (:error-text response))))))

(defn multi-request-with-go [params f on-success on-error]
  (go
    (doseq [param params]
      (let [response
            (async/<! (f param))]
        (when-not (:success response)
          (on-error (:status response) (:error-text response)))))
    (on-success)))

(defn get-config [{:keys [on-success on-error]}]
  (request-with-go connection/get-config on-success on-error))

(defn get-user-info [{:keys [on-success on-error]}]
  (request-with-go connection/get-user-info on-success on-error))

(defn check-session [{:keys [on-success on-error]}]
  (request-with-go connection/check-session on-success on-error))

(defn download-grant-applications [grant-id on-success on-error]
  (request-with-go #(connection/get-grant-applications grant-id)
                   on-success on-error))

(defn download-grants [on-success on-error]
  (request-with-go connection/get-grants-list on-success on-error))

(defn download-grant-payments [grant-id on-success on-error]
  (request-with-go #(connection/get-grant-payments grant-id)
                   on-success on-error))

(defn send-payments! [{:keys [applications values on-finished on-error]}]
  (go
    (doseq [application applications]
      (let [response
            (async/<! (connection/create-application-payment
                        (:id application) values))]
        (when-not (:success response)
          (on-error (:status response) (:error-text response)))))
    (on-finished)))

(defn combine-application-payment [application payment]
  (let [selected-values (select-keys payment [:id :version :state])]
    (merge
     application
     (clojure.set/rename-keys selected-values
                              {:id :payment-id
                               :version :payment-version
                               :state :payment-state}))))

(defn find-application-payment [payments application-id application-version]
  (first
   (filter
    #(and (= (:application-version %) application-version)
          (= (:application-id %) application-id))
    payments)))

(defn combine [applications payments]
  (mapv #(combine-application-payment
          % (find-application-payment payments (:id %) (:version %)))
        applications))

(defn download-grant-data [grant-id on-success on-error]
  (download-grant-applications
   grant-id
   (fn [applications]
     (download-grant-payments
      grant-id
      (fn [payments] (on-success applications payments))
      on-error))
   on-error))

(defn delete-grant-payments! [{:keys [grant-id on-success on-error]}]
  (request-with-go
   #(connection/delete-grant-payments grant-id) on-success on-error))

(defn get-grant-roles [{:keys [grant-id on-success on-error]}]
  (request-with-go
   #(connection/get-grant-roles grant-id) on-success on-error))

(defn get-payment-history [{:keys [application-id on-success on-error]}]
  (request-with-go #(connection/get-payment-history application-id)
                   on-success on-error))
