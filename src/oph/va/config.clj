(ns oph.va.config
  (:require [clojure.edn]
            [environ.core :refer [env]]))

(defn config-name [] (env :config))

(defonce defaults (-> "config/defaults.edn"
                      (slurp)
                      (clojure.edn/read-string)))

(defn merge-with-defaults [config]
  (merge-with merge defaults config))

(defonce config (->> (or (env :config) "config/dev.edn")
                    (slurp)
                    (clojure.edn/read-string)
                    (merge-with-defaults)))
