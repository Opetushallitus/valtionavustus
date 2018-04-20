(ns oph.va.virkailija.rondo-scheduling
  (:require [oph.va.virkailija.rondo-service :as rondo-service]
            [clojure.core.async :as a]
            [clojurewerkz.quartzite.scheduler :as qs]
            [clojurewerkz.quartzite.triggers :as t]
            [clojurewerkz.quartzite.jobs :as j]
            [clojurewerkz.quartzite.jobs :refer [defjob]]
            [clojurewerkz.quartzite.schedule.cron :refer [schedule cron-schedule]]
            [clojure.tools.logging :as log]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.invoice :as invoice]
            [oph.soresu.common.config :refer [config]]))

(def timeout-limit-schedule 600000)


(defn fetch-xml-files [xml-path list-of-files sftp-config]
  (doseq [filename list-of-files]
    (rondo-service/get-remote-file filename sftp-config)
    (try
      (payments-data/update-state-by-response
        (invoice/read-xml (format "%s/%s" xml-path filename)))
      (catch clojure.lang.ExceptionInfo e
        (if (= "already-paid" (-> e ex-data :cause))
          (rondo-service/delete-remote-file filename sftp-config))
          (throw (Exception. (str "Unable to update payment: " (-> e ex-data :error-message))))))
    (rondo-service/delete-remote-file filename sftp-config)
    (clojure.java.io/delete-file (format "%s/%s" xml-path filename))
    ))


(defn fetch-feedback-from-rondo [sftp-config]
  (let [list-of-files (rondo-service/get-remote-file-list sftp-config)
        xml-path (get sftp-config :local-path (System/getProperty "java.io.tmpdir"))
        result (fetch-xml-files xml-path list-of-files sftp-config)]
        (if (nil? result)
          {:success true}
          {:success false :value result})))

(defn get-state-of-payments [sftp-config]
  (let [c (a/chan)]
    (a/go
      (try
        (a/>! c (fetch-feedback-from-rondo sftp-config))
        (catch Exception e
          (a/>! c {:success false :exception e}))))
    (a/alt!!
      c ([v]
         (when (not (:success v))
           (throw (or (:exception v)
                      (Exception. (str (:value v))))))
         (log/debug "Succesfully fetched state from Rondo!")))
      (a/timeout timeout-limit-schedule) (log/debug "Succesfully fetched state from Rondo!")))


(defjob RondoJob
  [ctx]
  (log/info "Running scheduled fetch of payments now from rondo!")
  (get-state-of-payments (get-in config [:server :rondo-sftp])))

(defn schedule-fetch-from-rondo []
  (let [s   (-> (qs/initialize) qs/start)
        job (j/build
              (j/of-type RondoJob)
              (j/with-identity (j/key "jobs.RondoJob3")))
        trigger (t/build
                  (t/with-identity (t/key "triggers.Rondo"))
                  (t/start-now)
                  (t/with-schedule (schedule
                                     (cron-schedule (:scheduling (:rondo-scheduler config)) ))))]
  (qs/schedule s job trigger)))

(defn stop-schedule-from-rondo []
  (qs/delete-trigger (-> (qs/initialize) qs/start) (t/key "triggers.Rondo")))
