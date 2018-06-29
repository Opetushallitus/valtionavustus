(ns oph.va.virkailija.healthcheck
  (:require [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.remote-file-service
             :refer [get-remote-file-list]]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.utils :refer [with-timeout]]
            [clj-time.core :as time]
            [clj-time.format :as f]
            [oph.va.virkailija.scheduler :as s]))

(defonce ^:private status (atom []))

(defonce ^:private scheduler (atom nil))

(defn get-last-status []
  @status)

(defn check-rondo-status []
  (let [rondo-service (rondo-service/create-service
                        (get-in config [:server :rondo-sftp]))
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
           :timestamp (f/unparse (:basic-date-time f/formatters) (time/now)))))

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
