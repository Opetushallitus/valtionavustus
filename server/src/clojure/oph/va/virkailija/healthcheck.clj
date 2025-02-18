(ns oph.va.virkailija.healthcheck
  (:require [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.remote-file-service
             :refer [get-remote-file-list]]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.utils :refer [with-timeout]]
            [clj-time.core :as t]
            [clj-time.format :as f]
            [oph.va.virkailija.scheduler :as s]))

(defonce ^:private status (atom []))

(defonce ^:private scheduler (atom nil))

(defn is-expired? [check limit]
  (t/before? (:timestamp check) limit))

(defn validate-checks [coll limit-minutes]
  (let [limit
        (t/minus
         (t/now)
         (t/minutes limit-minutes))]
    (map #(assoc % :valid (not (is-expired? % limit))) coll)))

(defn set-timestamps [coll]
  (map
   #(assoc %
           :timestamp
           (f/unparse (:basic-date-time f/formatters) (:timestamp %)))
   coll))

(defn get-last-status []
  {:integrations (-> @status
                     (validate-checks
                      (+
                       (get-in
                        config [:integration-healthcheck :interval-minutes])
                       5))
                     set-timestamps)
   :current-timestamp (f/unparse (:basic-date-time f/formatters) (t/now))})

(defn check-rondo-status []
  (let [rondo-service (rondo-service/create-service
                       (get-in config [:server :payment-service-sftp]))
        result (with-timeout
                 #(try
                    (get-remote-file-list rondo-service)
                    {:success true :error ""}
                    (catch Exception e
                      {:success false :error (.getMessage e)}))
                 (get-in config [:integration-healthcheck :timeout] 5000)
                 {:success false :error "Timeout"})]
    (assoc result
           :service "rondo"
           :timestamp (t/now))))

(defn update-status! []
  (reset! status
          [(check-rondo-status)]))

(defn start-schedule-status-update! []
  (when (nil? @scheduler)
    (reset! scheduler
            (s/after
             (get-in config [:integration-healthcheck :interval-minutes])
             :minute
             update-status!))))

(defn stop-schedule-status-update! []
  (when (some? @scheduler)
    (s/stop @scheduler)
    (reset! scheduler nil)))
