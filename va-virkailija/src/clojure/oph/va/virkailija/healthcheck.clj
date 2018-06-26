(ns oph.va.virkailija.healthcheck
  (:require [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.remote-file-service
             :refer [get-remote-file-list]]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.utils :refer [with-timeout]]
            [clj-time.core :as time]
            [clj-time.format :as f]
            [clojurewerkz.quartzite.scheduler :as qs]
            [clojurewerkz.quartzite.triggers :as t]
            [clojurewerkz.quartzite.jobs :refer [defjob] :as j]
            [clojurewerkz.quartzite.schedule.cron
             :refer [schedule cron-schedule]]))

(defonce ^:private status (atom []))

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

(defjob HealthCheckJob [ctx]
  (update-status!))

(defn start-schedule-status-update! []
  (let [s (qs/start (qs/initialize))
        job (j/build
              (j/of-type HealthCheckJob)
              (j/with-identity (j/key "jobs.HealthCheckJob")))
        trigger
        (t/build
          (t/with-identity (t/key "triggers.HealthCheck"))
          (t/start-now)
          (t/with-schedule
            (schedule
              (cron-schedule
                (get-in config [:integration-healthcheck :cron])))))]
    (qs/schedule s job trigger)))

(defn stop-schedule-status-update! []
  (qs/delete-trigger
    (qs/start (qs/initialize)) (t/key "triggers.HealthCheck")))
