(ns oph.va.virkailija.va-users
  (:require [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.kayttooikeus-service :as kayttooikeus]
            [oph.va.virkailija.oppijanumerorekisteri-service :as oppijanumerorekisteri]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.common.background-job-supervisor :as job-supervisor]
            [clojure.string :as string]
            [clojure.core.async :refer [>!! alts! go chan timeout]]
            [clojure.tools.logging :as log]))

(def ^:private va-users-update-chan (chan 1))

(def ^:private va-users-cache-refresh-interval-in-ms
  (when-not *compile-files*
    (-> config
        (get-in [:va-users :cache-refresh-interval-in-s])
        (* 1000))))

(def ^:private va-users-cache-max-refresh-interval-in-ms
  (when-not *compile-files*
    (-> config
        (get-in [:va-users :cache-max-refresh-interval-in-s])
        (* 1000))))

(defn- get-all-va-users []
  (let [people-privileges                (kayttooikeus/get-va-people-privileges)
        person-oids                      (keys people-privileges)
        people-info                      (zipmap person-oids (oppijanumerorekisteri/get-people person-oids))
        {:keys [with-info without-info]} (reduce-kv (fn [acc person-oid person-info]
                                                      (if (nil? person-info)
                                                        (merge-with conj acc {:without-info person-oid})
                                                        (merge-with conj acc {:with-info (merge person-info
                                                                                                (get people-privileges person-oid)
                                                                                                {:person-oid person-oid})})))
                                                    {:with-info [] :without-info []}
                                                    people-info)
        {:keys [with-email without-email]} (reduce (fn [acc user]
                                                    (if (nil? (:email user))
                                                      (merge-with conj acc {:without-email user})
                                                      (merge-with conj acc {:with-email user})))
                                                  {:with-email [] :without-email []}
                                                  with-info)]
    (when (seq without-info)
      (log/warn "Fetching all VA users, skipping users without person info:" without-info))
    (when (seq without-email)
      (log/warn "Fetching all VA users, skipping users without email address:" without-email))
    with-email))

(defn- update-va-users-cache []
  (virkailija-db/update-va-users-cache (get-all-va-users)))

(defn- try-to-update-va-users-cache [failures refresh-interval-ms]
  (try (update-va-users-cache)
       (log/info "Successfully updated VA users cache")
       {:failures 0 :refresh-interval-ms refresh-interval-ms}
       (catch Exception e
         (let [updated-values {:failures (+ failures 1)
                               :refresh-interval-ms (* refresh-interval-ms 2)}]
           (log/logf (if (> (:failures updated-values) 5) :error :warn)
                     e
                     "Failed updating VA users cache (%d time(s) in a row), retrying in %.0f secs..."
                     (:failures updated-values)
                     (double (/ (:refresh-interval-ms updated-values) 1000)))
           updated-values))))


(defn- start-loop-update-va-users-cache []
  (go
    (log/info "Starting background job: update VA users cache...")
    (loop [failures 0 refresh-interval-ms va-users-cache-refresh-interval-in-ms]
      (let [next-iter-values (try-to-update-va-users-cache failures refresh-interval-ms)
            [value _] (alts! [va-users-update-chan (timeout (:refresh-interval-ms next-iter-values))])]
        (when (nil? value)
          (recur
            (:failures next-iter-values)
            (min va-users-cache-max-refresh-interval-in-ms (:refresh-interval-ms next-iter-values))))))
    (log/info "Stopped background job: update VA users cache.")))

(defn start-background-job-update-va-users-cache []
  (job-supervisor/start-background-job :update-va-users-cache
                                       start-loop-update-va-users-cache
                                       #(>!! va-users-update-chan {:operation :stop})))

(defn stop-background-job-update-va-users-cache []
  (job-supervisor/stop-background-job :update-va-users-cache))

(defn get-va-user-by-username [username]
  (when-let [privileges (kayttooikeus/get-va-person-privileges username)]
    (let [person-oid (:person-oid privileges)]
      (when-let [[source person-info] (or (when-let [found (virkailija-db/get-va-user-cache-by-person-oid person-oid)]
                                            ["cache" found])
                                          (when-let [found (oppijanumerorekisteri/get-person person-oid)]
                                            ["service" found]))]
        (log/debugf "get-va-user-by-username, found user \"%s\" (%s) from %s" username person-oid source)
        (merge person-info privileges {:username username})))))

(defn search-input->terms [search-input]
  (-> search-input
      (string/trim)
      (string/split #"\s+")
      distinct))

(defn search-va-users [search-input]
  (-> search-input
      search-input->terms
      virkailija-db/search-va-users-cache-by-terms))
