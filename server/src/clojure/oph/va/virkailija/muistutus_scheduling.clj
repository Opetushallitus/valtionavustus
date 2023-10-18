(ns oph.va.virkailija.muistutus-scheduling
  (:require [clojure.tools.logging :as log]
            [oph.soresu.common.db :refer [with-tx query]]
            [clojurewerkz.quartzite.scheduler :as qs]
            [clojurewerkz.quartzite.jobs :as j]
            [clojurewerkz.quartzite.triggers :as t]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.db :as virkailija-db]
            [clojurewerkz.quartzite.schedule.simple :refer [schedule with-interval-in-minutes, repeat-forever]])
  (:import (java.time.format DateTimeFormatter)))

(defn- format-date [date]
  (.format date (DateTimeFormatter/ofPattern "dd.MM.yyyy")))

(defn send-muistutusviestit []
  (try
    (with-tx (fn [tx]
               (let [raportointivelvoitteet (query tx "WITH raportointivelvoitteet AS (
                                                        SELECT r.id,
                                                               r.avustushaku_id,
                                                               a.content->'name'->'fi' as name,
                                                               r.raportointilaji
                                                        FROM raportointivelvoite r
                                                        JOIN avustushaut a ON a.id = r.avustushaku_id
                                                        WHERE r.muistutus_lahetetty IS NULL AND
                                                              r.maaraaika > now()::date AND
                                                              r.maaraaika <= (now() + '30 days'::interval)::date
                                                      )
                                                      UPDATE raportointivelvoite
                                                      SET muistutus_lahetetty = now()
                                                      FROM raportointivelvoitteet rt
                                                      WHERE raportointivelvoite.id  = rt.id
                                                      RETURNING rt.id, rt.avustushaku_id, rt.name, maaraaika, rt.raportointilaji" [])]
                 (doseq [raportointivelvoite raportointivelvoitteet]
                   (let [avustushaku-id (:avustushaku-id raportointivelvoite)
                         to (virkailija-db/get-valmistelija-emails-assigned-to-avustushaku avustushaku-id)
                         name (:name raportointivelvoite)
                         type (case (:raportointilaji raportointivelvoite)
                                    "Avustuspäätökset" "raportointivelvoite-muistutus-avustuspaatokset"
                                    "Väliraportti" "raportointivelvoite-muistutus-valiraportti"
                                    "Loppuraportti" "raportointivelvoite-muistutus-loppuraportti"
                                    "Muu raportti" "raportointivelvoite-muistutus-muu-raportti")
                         maaraika (format-date (:maaraaika raportointivelvoite))]
                     (email/send-raportointivelvoite-muistutus to avustushaku-id name maaraika type))))))
    (catch Exception e
      (log/error e "Failed to send muistutusviestit for raportointivelvoitteet"))))

(j/defjob MuistutusJob
          [ctx]
          (send-muistutusviestit))

(def muistutus-scheduler (delay (qs/initialize)))

(defn schedule-raportointivelvoite-muistutusviestit []
  (log/info "Starting background job: raportointivelvoite muistutusviestit...")
  (let [s (qs/start @muistutus-scheduler)
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
  (qs/shutdown @muistutus-scheduler))
