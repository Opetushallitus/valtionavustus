(ns oph.va.virkailija.rondo-scheduling
  (:require [oph.va.virkailija.rondo-service :as rondo-service]
            [clojure.core.async :as a]
            [clojurewerkz.quartzite.scheduler :as qs]
            [clojurewerkz.quartzite.triggers :as t]
            [clojurewerkz.quartzite.jobs :refer [defjob] :as j]
            [clojurewerkz.quartzite.schedule.cron
             :refer [schedule cron-schedule]]
            [clojure.tools.logging :as log]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.invoice :as invoice]
            [oph.soresu.common.config :refer [config]]
            [ring.util.http-response :refer [ok not-found request-timeout]]
            [oph.va.virkailija.remote-file-service :refer :all])
  (:import [oph.va.virkailija.rondo_service RondoFileService]))

(def timeout-limit 600000)

(defn pop-remote-files [list-of-files remote-service]
  (log/info "Will fetch the following files from Rondo: " list-of-files)
  (doseq [filename list-of-files]
    (get-remote-file remote-service filename)
    (try
      (payments-data/update-paymentstatus-by-response
        (invoice/read-xml (get-local-file remote-service filename)))

      (delete-remote-file! remote-service filename)
      (clojure.java.io/delete-file (get-local-file remote-service filename))

      (catch clojure.lang.ExceptionInfo e
        (case (-> e ex-data :cause)
          "already-paid" (do
                           (log/info (format "Payment of response %s already paid. Ignoring and deleting remote file." filename))
                           (delete-remote-file! remote-service filename))
          "no-payment" (log/info (format "No corresponding payment found for response %s. Ignoring." filename))
          :else (report-exception remote-service (format "Error while processing file %s" filename) e)))
      (catch javax.xml.stream.XMLStreamException e
        (report-exception remote-service (format "Error while processing file %s" filename) e)))))

(defn fetch-feedback-from-rondo [remote-service]
  (log/debug "Running the fetch-feed-back-from rondo..")
  (let [list-of-files (get-remote-file-list remote-service)
        result (pop-remote-files list-of-files remote-service)]
    (if (nil? result)
      {:success true}
      {:success false :value result})))

(defn get-statuses-of-payments [remote-service]
  (let [c (a/chan)]
    (a/go
      (try
        (a/>! c (fetch-feedback-from-rondo remote-service))
        (catch Exception e
          (a/>! c {:success false :exception e}))))
    (a/alt!!
      c ([v]
         (when-not (:success v)
           (throw (or (:exception v)
                      (Exception. (str (:value v))))))
         (log/debug "Succesfully fetched statuses from Rondo!"))
      (a/timeout timeout-limit) ([_] (log/warn "Timeout from Rondo!")))))

(defjob RondoJob
  [ctx]
  (log/info "Running scheduled fetch of payments now from rondo!")
  (let [remote-service (rondo-service/create-service
                         (get-in config [:server :rondo-sftp]))]
          (get-statuses-of-payments remote-service)))

(defn schedule-fetch-from-rondo []
  (let [s (qs/start (qs/initialize))
        job (j/build
              (j/of-type RondoJob)
              (j/with-identity (j/key "jobs.RondoJob3")))
        trigger (t/build
                  (t/with-identity (t/key "triggers.Rondo"))
                  (t/start-now)
                  (t/with-schedule
                    (schedule
                      (cron-schedule
                        (:scheduling (:rondo-scheduler config))))))]
    (qs/schedule s job trigger)))

(defn stop-schedule-from-rondo []
  (qs/delete-trigger (qs/start (qs/initialize)) (t/key "triggers.Rondo")))
