(ns oph.soresu.common.config
  (:require [clojure.edn]
            [environ.core :refer [env]]
            [clojure.java.io :as io]
            [clojure.tools.logging :as log]))

(defn config-name [] (env :config))

(defn config-simple-name []
  (last (re-find #"\S+/(\S+).edn" (config-name))))

(def defaults
  (when-not *compile-files*
    (-> (or (env :configdefaults) "config/defaults.edn")
        (slurp)
        (clojure.edn/read-string))))

(defn- slurp-if-found [path]
  (try
    (slurp path)
    (catch Exception e
      (log/warn (str "Could not read configuration from '" path "'"))
      "{}")))

(def secrets
  (when-not *compile-files*
    (if-let [config-secrets (env :configsecrets)]
      (->  config-secrets
           (slurp-if-found)
           (clojure.edn/read-string)))))

(defn- merge-with-defaults [config]
  (merge-with merge defaults config))

(defn- merge-with-secrets [config]
  (if-let [secrets-config secrets]
    (merge-with merge config secrets-config)
    config))

(defn- merge-with-environment [config]
  (merge-with merge config
              (into {:db (filter val {:server-name (System/getenv "DB_HOSTNAME")
                                      :password (System/getenv "DB_PASSWORD")})
                     })))

(def config
  (when-not *compile-files*
    (->> (or (env :config) "config/dev.edn")
         (slurp)
         (clojure.edn/read-string)
         (merge-with-secrets)
         (merge-with-defaults)
         (merge-with-environment))))

(def environment
  (when-not *compile-files*
    (or (env :environment) (:environment config))))

(defn without-authentication? []
  (let [use-fake-auth (-> config :server :without-authentication?)]
    (when (and use-fake-auth (not= "dev" environment))
      (throw (Exception. (str "Disabling authentication is allowed only in dev environment (env=" environment ")"))))
    use-fake-auth))

(defn- enabled-features [flags env]
  (letfn [(feature-enabled? [[_ envs]] (some #(= % env) envs))]
    (set (map first (filter feature-enabled? flags)))))

(defn get-feature-flags []
  (let [flags-file (io/resource "feature-flags.edn")
        flags      (clojure.edn/read-string (slurp flags-file))]
    (enabled-features flags (keyword environment))))

(defn feature-enabled? [flag]
  (contains? (get-feature-flags) flag))
