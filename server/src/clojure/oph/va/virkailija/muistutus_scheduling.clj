(ns oph.va.virkailija.muistutus-scheduling
  (:require [clojure.tools.logging :as log]
            [clojurewerkz.quartzite.scheduler :as qs]
            [clojurewerkz.quartzite.jobs :as j]
            [clojurewerkz.quartzite.triggers :as t]
            [clojurewerkz.quartzite.schedule.simple :refer [schedule with-interval-in-minutes, repeat-forever]]))

(j/defjob MuistutusJob
          [ctx]
          (log/info "Implement me"))

(defn schedule-raportointivelvoite-muistutusviestit []
  (log/info "Starting background job: raportointivelvoite muistutusviestit...")
  (let [s (qs/start (qs/initialize))
        job (j/build
              (j/of-type MuistutusJob)
              (j/with-identity (j/key "jobs.raportointivelvoite.1")))
        trigger (t/build
                  (t/with-identity (t/key "triggers.raportointivelvoite"))
                  (t/start-now)
                  (t/with-schedule
                    (schedule
                      (repeat-forever)
                      (with-interval-in-minutes 60))))]
    (qs/schedule s job trigger)))

(defn stop-schedule-raportointivelvoite-muistutusviestit []
  (log/info "Stopping background job: raportointivelvoite muistutusviestit...")
  (qs/delete-trigger (qs/start (qs/initialize)) (t/key "triggers.raportointivelvoite")))
