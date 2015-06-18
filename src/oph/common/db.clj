(ns oph.common.db
  (:use [oph.common.config :only [config config-name]]
        [clojure.tools.trace :only [trace]])
  (:require [clojure.java.jdbc :as jdbc]
            [hikari-cp.core :refer :all]
            [oph.common.jdbc.extensions]
            [pandect.algo.sha256 :refer :all])
  (:import [java.security SecureRandom]))

(def random (SecureRandom.))

(defn generate-hash-id []
  (sha256 (.generateSeed random (/ 512 8))))

(def datasource-spec
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
          :adapter "postgresql"}
         (:db config)))

(def datasource (atom nil))

(defn get-datasource []
  (swap! datasource (fn [ds]
                      (if (nil? ds)
                        (make-datasource datasource-spec)
                        ds))))

(defn close-datasource! []
  (swap! datasource (fn [ds]
                      (when ds
                        (close-datasource ds)))))

(defn clear-db! []
  (if (:allow-db-clear? (:server config))
    (try (apply (partial jdbc/db-do-commands {:datasource (get-datasource)} true)
           ["drop schema public cascade"
            "create schema public"])
         (catch Exception e (.printStackTrace (.getNextException e))))
    (throw (RuntimeException. (str "Clearing database is not allowed! "
                                   "check that you run with correct mode. "
                                   "Current config name is " (config-name))))))

(defmacro exec [query params]
  `(jdbc/with-db-transaction [connection# {:datasource (get-datasource)}]
     (~query ~params {:connection connection#})))
