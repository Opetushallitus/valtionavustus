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

(defn- start-loop-update-va-users-cache []
  (go
    (log/info "Starting background job: update VA users cache...")
    (loop [failures 0 refresh-interval-ms va-users-cache-refresh-interval-in-ms]
      (let [next-iter-values (try (update-va-users-cache)
                                  (if (> failures 0)
                                    (log/infof "Successfully resumed updating VA users cache after failure (failed %d time(s) in a row)"
                                               failures)
                                    (log/info "Successfully updated VA users cache"))
                                  {:new-failures 0 :new-refresh-interval-ms refresh-interval-ms}
                                  (catch Exception e
                                    (let [new-failures (+ failures 1)
                                          new-refresh-interval-ms (* refresh-interval-ms 2)]
                                      (log/logf (if (> new-failures 5) :error :warn)
                                                e
                                                "Failed updating VA users cache (%d time(s) in a row), retrying in %.0f secs..."
                                                new-failures
                                                (double (/ new-refresh-interval-ms 1000)))
                                      {:new-failures new-failures
                                       :new-refresh-interval-ms new-refresh-interval-ms})))
            new-failures (:new-failures next-iter-values)
            new-refresh-interval-ms (:new-refresh-interval-ms next-iter-values)
            [value _] (alts! [va-users-update-chan (timeout new-refresh-interval-ms)])]
        (when (nil? value)
          (recur
            new-failures
            (min va-users-cache-max-refresh-interval-in-ms new-refresh-interval-ms)))))
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
