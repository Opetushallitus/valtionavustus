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
  (let [payment-service (merge-with merge
                                    {:payment-service-sftp (get-in config [:server :payment-service-sftp])}
                                    (into {:payment-service-sftp
                                           (filter val {:host-ip  (System/getenv "PAYMENT_SERVICE_HOST")
                                                        :username (System/getenv "PAYMENT_SERVICE_USERNAME")
                                                        :password (System/getenv "PAYMENT_SERVICE_PASSWORD")})}))
        merged-with-environment (merge-with merge config
                                            (into {:server (filter val {:cookie-key           (System/getenv "SERVER_COOKIE_KEY")
                                                                        :payment-service-sftp (:payment-service-sftp payment-service)})
                                                   :db     (filter val {:server-name   (System/getenv "DB_HOSTNAME")
                                                                        :database-name (System/getenv "DB_NAME")
                                                                        :username      (System/getenv "DB_USERNAME")
                                                                        :password      (System/getenv "DB_PASSWORD")})
                                                   :email  (filter val {:username                     (System/getenv "SMTP_AUTH_USERNAME")
                                                                        :password                     (System/getenv "SMTP_AUTH_PASSWORD")
                                                                        :host                         (System/getenv "SMTP_HOSTNAME")
                                                                        :bounce-address               (System/getenv "SMTP_BOUNCE_ADDRESS")
                                                                        :kuukausittainen-tasmaytysraportti (not-empty (filter some? [(System/getenv "EMAIL_TO_TALOUSPALVELUT")
                                                                                                                                     (System/getenv "EMAIL_TO_TUKI")]))
                                                                        :to-taloustarkastaja          (not-empty (filter some? [(System/getenv "EMAIL_TO_TALOUSPALVELUT")]))
                                                                        :to-palkeet                   (not-empty (filter some? [(System/getenv "EMAIL_TO_PALKEET")]))
                                                                        :to-palkeet-ja-talouspalvelut (not-empty (filter some? [(System/getenv "EMAIL_TO_PALKEET")
                                                                                                                                (System/getenv "EMAIL_TO_TALOUSPALVELUT")]))

                                                     })
                           :opintopolku (filter val {:cas-service-username (System/getenv "CAS_SERVICE_USERNAME")
                                                     :cas-service-password (System/getenv "CAS_SERVICE_PASSWORD")})}))]

    (if (some? (System/getenv "OFFICER_EDIT_JWT_SECRET"))
      (assoc merged-with-environment :officer-edit-jwt-secret (System/getenv "OFFICER_EDIT_JWT_SECRET"))
      merged-with-environment)))

(def config
  (when-not *compile-files*
    (->> (or (env :config) "config/local.edn")
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
    (when (and use-fake-auth (not= "local" environment))
      (throw (Exception. (str "Disabling authentication is allowed only in local environment (env=" environment ")"))))
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
