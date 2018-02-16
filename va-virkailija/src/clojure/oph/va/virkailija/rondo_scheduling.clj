(ns oph.va.virkailija.rondo-scheduling
  (:require [oph.va.virkailija.rondo-service :as rondo-service]
            [clojurewerkz.quartzite.scheduler :as qs]
            [clojurewerkz.quartzite.triggers :as t]
            [clojurewerkz.quartzite.jobs :as j]
            [clojurewerkz.quartzite.jobs :refer [defjob]]
            [clojurewerkz.quartzite.schedule.cron :refer [schedule cron-schedule]]
            [clojure.tools.logging :as log]
            [oph.va.virkailija.rondo-service :as rondo-service]))


(defjob RondoJob
  [ctx]
  (rondo-service/get-state-from-rondo)
  (log/info "Running scheduled fetch of payments now from rondo!"))

(defn schedule-fetch-from-rondo []
  (let [s   (-> (qs/initialize) qs/start)
        job (j/build
              (j/of-type RondoJob)
              (j/with-identity (j/key "jobs.RondoJob")))
        trigger (t/build
                  (t/with-identity (t/key "triggers.Rondo"))
                  (t/start-now)
                  (t/with-schedule (schedule
                                     (cron-schedule "0 00 04 ? * *"))))]
  (qs/schedule s job trigger)))

(defn stop-schedule-from-rondo []
  (qs/delete-trigger (-> (qs/initialize) qs/start) (t/key "triggers.Rondo")))
