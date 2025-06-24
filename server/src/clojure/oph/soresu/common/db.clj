(ns oph.soresu.common.db
  (:use [oph.soresu.common.config :only [config config-name]]
        [clojure.tools.trace :only [trace]])
  (:require [buddy.core.hash :as buddy-hash]
            [buddy.core.codecs :as buddy-codecs]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [hikari-cp.core :refer :all]
            [oph.soresu.common.jdbc.extensions])
  (:import [java.security SecureRandom]))

(def random (SecureRandom.))

(defn generate-hash-id []
  (-> (.generateSeed random (/ 512 8))
      buddy-hash/sha256
      buddy-codecs/bytes->hex))

(defn escape-like-pattern [pattern]
  (string/replace pattern #"(\\|%|_)" "\\\\$1"))

(defn- datasource-spec []
  "Merge configuration defaults and db config. Latter overrides the defaults"
  (merge {:auto-commit false
          :read-only false
          :connection-timeout 30000
          :validation-timeout 5000
          :idle-timeout 600000
          :max-lifetime 1800000
          :minimum-idle 10
          :maximum-pool-size 10
          :pool-name "db-pool"
          :adapter "postgresql"
          :currentSchema "virkailija,hakija"}
         (-> (:db config)
             (dissoc :schema))))

(defonce datasource (atom {}))

(defn get-datasource []
  (swap! datasource (fn [datasources]
                      (if (not (contains? datasources :db))
                        (let [ds (make-datasource (datasource-spec))]
                          (assoc datasources :db ds))
                        datasources)))
  (:db @datasource))

(defn close-datasource! []
  (swap! datasource (fn [datasources]
                      (if (contains? datasources :db)
                        (let [ds (:db datasources)]
                          (close-datasource ds)
                          (dissoc datasources :db))
                        datasources))))

(defn get-next-exception-or-original [original-exception]
  (try (.getNextException original-exception)
       (catch IllegalArgumentException iae
         original-exception)))

(defn clear-db-and-grant! [schema-name grant-user]
  (if (:allow-db-clear? (:server config))
    (try
      (jdbc/db-do-commands
       {:datasource (get-datasource)}
       (into []
             (concat
              [(if (= schema-name "virkailija") "delete from hakija.hakemukset" "")
               (str "drop schema if exists " schema-name " cascade")
               (str "create schema " schema-name)]
              (if grant-user
                [(str "grant usage on schema " schema-name " to " grant-user)
                 (str "alter default privileges in schema " schema-name " grant select on tables to " grant-user)]))))
      (catch Exception e (log/error (get-next-exception-or-original e) (.toString e))))
    (throw (RuntimeException. (str "Clearing database is not allowed! "
                                   "check that you run with correct mode. "
                                   "Current config name is " (config-name))))))

(defmacro exec [query params]
  `(jdbc/with-db-transaction [connection# {:datasource (get-datasource)} {:isolation :repeatable-read}]
     (~query ~params {:connection connection#})))

(defmacro exec-all [query-list]
  `(jdbc/with-db-transaction [connection# {:datasource (get-datasource)} {:isolation :repeatable-read}]
     (last (for [[query# params#] (partition 2 ~query-list)]
             (query# params# {:connection connection#})))))

(defmacro with-transaction [connection & body]
  `(let [~connection {:datasource (get-datasource)}]
     (jdbc/with-db-transaction [conn# ~connection {:isolation :repeatable-read}]
       ~@body)))

(defn with-tx [func]
  (jdbc/with-db-transaction [connection {:datasource (get-datasource)} {:isolation :repeatable-read}]
    (func connection)))

(defn query
  "Execute SQL query and convert underscores to dashes in returned identifiers"
  ([sql params] (with-tx (fn [tx] (query tx sql params))))
  ([tx sql params] (jdbc/query tx (concat [sql] params) {:identifiers #(.replace % \_ \-)})))

(defn query-original-identifiers
  "Query, but preserves underscores in identifiers"
  ([sql params] (with-tx (fn [tx] (query-original-identifiers tx sql params))))
  ([tx sql params] (jdbc/query tx (concat [sql] params))))

(defn execute!
  ([sql params] (with-tx (fn [tx] (execute! tx sql params))))
  ([tx sql params] (jdbc/execute! tx (concat [sql] params) {:identifiers #(.replace % \_ \-)})))
