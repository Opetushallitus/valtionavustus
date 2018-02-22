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
            [oph.va.virkailija.payments-routes :as payments-routes]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.invoice :as invoice]
            [ring.util.http-response :refer [ok not-found request-timeout]]))

(def timeout-limit-schedule 600000)


(defn fetch-xml-files [xml-path list-of-files]
        (doseq [filename list-of-files]
          (rondo-service/get-remote-file filename)
          (try
            (payments-data/update-state-by-response (invoice/read-xml (format "%s/%s" xml-path filename)))
           (catch Exception e (ex-data e)))
          (rondo-service/delete-remote-file filename)
          (clojure.java.io/delete-file (format "%s/%s" xml-path filename))))


(defn fetch-feedback-from-rondo []
  (let [list-of-files (rondo-service/get-remote-file-list)
        xml-path (System/getProperty"java.io.tmpdir")
        result (fetch-xml-files xml-path  list-of-files)]
        (if (nil? result)
          {:success true}
          {:success false :value result})))

(defn get-state-of-payments []
      (let [c (a/chan)]
        (a/go
          (try
            (a/>! c (fetch-feedback-from-rondo))
            (catch Exception e
              (a/>! c {:success false :exception e}))))
        (a/alt!!
          c ([v]
             (when (not (:success v))
               (throw (or (:exception v)
                          (Exception. (str (:value v))))))
             (ok (log/debug "Succesfully fetched state from Rondo!")))
          (a/timeout timeout-limit-schedule) ([_] (request-timeout "Rondo timeout")))))

(defjob RondoJob
  [ctx]
  (log/info "Running scheduled fetch of payments now from rondo!")
  (get-state-of-payments))

(defn schedule-fetch-from-rondo []
  (let [s   (-> (qs/initialize) qs/start)
        job (j/build
              (j/of-type RondoJob)
              (j/with-identity (j/key "jobs.RondoJob3")))
        trigger (t/build
                  (t/with-identity (t/key "triggers.Rondo"))
                  (t/start-now)
                  (t/with-schedule (schedule
                                     (cron-schedule "0 32 16 ? * *"))))]
  (qs/schedule s job trigger)))

(defn stop-schedule-from-rondo []
  (qs/delete-trigger (-> (qs/initialize) qs/start) (t/key "triggers.Rondo")))
