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
  (log/info "Running Loppuselvitys taloustarkastamatta")
  (send-loppuselvitys-taloustarkastamatta-notifications))

(defjob ValiselvitysTarkastamattaNotification [ctx]
  (log/info "Running Valiselvitys tarkastamatta")
  (send-valiselvitys-tarkastamatta-notifications))

(defjob LahetaValiselvityspyynnotNotification [ctx]
  (log/info "Running Laheta valiselvityspyynnot")
  (send-laheta-valiselvityspyynnot-notifications))

(defjob LahetaLoppuselvityspyynnotNotification [ctx]
  (log/info "Running Laheta loppuselvityspyynnot")
  (send-laheta-loppuselvityspyynnot-notifications))

(defjob HakuaikaPaattymassaNotification [ctx]
  (log/info "Running Hakuaika päättymässä")
  (send-hakuaika-paattymassa-notifications))

(defjob HakuaikaPaattynytNotification [ctx]
  (log/info "Running Hakuaika päättynyt")
  (send-hakuaika-paattynyt-notifications))

(defjob LoppuselvitysPalauttamattaNotification [ctx]
  (log/info "Running loppuselvitys palauttamatta")
  (send-loppuselvitys-palauttamatta-notifications))

(defjob ValiselvitysPalauttamattaNotification [ctx]
  (log/info "Running loppuselvitys palauttamatta")
  (send-valiselvitys-palauttamatta-notifications))

(defn- get-notification-jobs []
  (filter :enabled?
    [
      {
        :enabled? (get-in config [:notifications :asiatarkastus :enabled?])
        :key "LoppuselvitysAsiatarkastamatta"
        :job LoppuselvitysAsiatarkastamattaNotification
        :schedule (schedule
                    (cron-schedule
                      (get-in config [:notifications :asiatarkastus :schedule])))
      }
      { :enabled? (get-in config [:notifications :taloustarkastus :enabled?])
        :key "LoppuselvitysTaloustarkastamatta"
        :job LoppuselvitysTaloustarkastamattaNotification
        :schedule (schedule
                    (cron-schedule
                      (get-in config [:notifications :taloustarkastus :schedule])))
      }
      { :enabled? (get-in config [:notifications :valiselvitys :enabled?])
        :key "ValiselvitysTarkastamatta"
        :job ValiselvitysTarkastamattaNotification
        :schedule (schedule
                    (cron-schedule
                      (get-in config [:notifications :valiselvitys :schedule])))
      }
      { :enabled? (get-in config [:notifications :laheta-valiselvityspyynnot :enabled?])
        :key "LahetaValiselvityspyynnot"
        :job LahetaValiselvityspyynnotNotification
        :schedule (schedule
                    (cron-schedule
                      (get-in config [:notifications :laheta-valiselvityspyynnot :schedule])))
      }
      { :enabled? (get-in config [:notifications :laheta-loppuselvityspyynnot :enabled?])
        :key "LahetaLoppuselvityspyynnot"
        :job LahetaLoppuselvityspyynnotNotification
        :schedule (schedule
                   (cron-schedule
                    (get-in config [:notifications :laheta-loppuselvityspyynnot :schedule])))
        }
      { :enabled? (get-in config [:notifications :hakuaika-paattymassa :enabled?])
        :key "HakuaikaPaattymassa"
        :job HakuaikaPaattymassaNotification
        :schedule (schedule
                   (cron-schedule
                    (get-in config [:notifications :hakuaika-paattymassa :schedule])))
      }
      { :enabled? (get-in config [:notifications :hakuaika-paattynyt :enabled?])
        :key "HakuaikaPaattynyt"
        :job HakuaikaPaattynytNotification
        :schedule (schedule (cron-schedule (get-in config [:notifications :hakuaika-paattynyt :schedule])))}
      { :enabled? (get-in config [:notifications :loppuselvitys-palauttamatta :enabled?])
        :key "LoppuselvitysPalauttamatta"
        :job LoppuselvitysPalauttamattaNotification
        :schedule (schedule
                   (cron-schedule
                    (get-in config [:notifications :loppuselvitys-palauttamatta :schedule])))
      }
      { :enabled? (get-in config [:notifications :valiselvitys-palauttamatta :enabled?])
        :key "ValiselvitysPalauttamatta"
        :job ValiselvitysPalauttamattaNotification
        :schedule (schedule
                   (cron-schedule
                    (get-in config [:notifications :valiselvitys-palauttamatta :schedule])))
      }
    ]))

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
    (doseq [job jobs] (stop-job job))))
