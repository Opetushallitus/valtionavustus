(ns oph.va.virkailija.notification-scheduler
  (:require [clojure.core.async :as a]
            [clojurewerkz.quartzite.scheduler :as qs]
            [clojurewerkz.quartzite.triggers :as t]
            [clojurewerkz.quartzite.jobs :refer [defjob] :as j]
            [clojurewerkz.quartzite.schedule.cron :refer [schedule cron-schedule]]
            [clojure.tools.logging :as log]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.virkailija-notifications :refer :all]))

(defjob LoppuselvitysAsiatarkastamattaNotification [ctx]
  (log/info "Running Loppuselvitys asiatarkastamatta")
  (send-loppuselvitys-asiatarkastamatta-notifications))

(defn start-notification-scheduler []
  (let [s (qs/start (qs/initialize))
        job (j/build
              (j/of-type LoppuselvitysAsiatarkastamattaNotification)
              (j/with-identity (j/key "jobs.LoppuselvitysAsiatarkastamatta")))
        trigger (t/build
                  (t/with-identity (t/key "triggers.LoppuselvitysAsiatarkastamatta"))
                  (t/start-now)
                  (t/with-schedule
                    (schedule
                      (cron-schedule
                        (:loppuselvitys-asiatarkastamatta-schedule (:notification-scheduler config))))))]
    (qs/schedule s job trigger)))

(defn stop-notification-scheduler []
  (qs/delete-trigger (qs/start (qs/initialize)) (t/key "triggers.LoppuselvitysAsiatarkastamatta")))
