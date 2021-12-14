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

(defjob LoppuselvitysTaloustarkastamattaNotification [ctx]
  (when (:enabled? (:taloustarkastus config))
    (do
      (log/info "Running Loppuselvitys taloustarkastamatta")
      (send-loppuselvitys-taloustarkastamatta-notifications))))

(defn- get-notification-jobs []
  [
    {
      :key "LoppuselvitysAsiatarkastamatta"
      :job LoppuselvitysAsiatarkastamattaNotification
      :schedule (schedule
                  (cron-schedule
                    (:loppuselvitys-asiatarkastamatta-schedule (:notification-scheduler config))))
    }
    {
      :key "LoppuselvitysTaloustarkastamatta"
      :job LoppuselvitysTaloustarkastamattaNotification
      :schedule (schedule
                  (cron-schedule
                    (:loppuselvitys-taloustarkastamatta-schedule (:notification-scheduler config))))
    }
  ])

(defn- start-job [job]
  (qs/schedule
    (qs/start (qs/initialize))
    (j/build
      (j/of-type (:job job))
      (j/with-identity (j/key (str "jobs." (:key job)))))
    (t/build
      (t/with-identity (t/key (str "triggers." (:key job))))
      (t/start-now)
      (t/with-schedule (:schedule job)))))

(defn start-notification-scheduler []
  (let [jobs (get-notification-jobs)]
    (doseq [job jobs] (start-job job))))

(defn- stop-job [job]
  (qs/delete-trigger (qs/start (qs/initialize)) (t/key (str "triggers." (:key job)))))

(defn stop-notification-scheduler []
  (let [jobs (get-notification-jobs)]
    (doseq [job jobs] (start-job job))))
