(ns oph.common.config
  (:require [clojure.edn]
            [environ.core :refer [env]]))

(defn config-name [] (env :config))

(defn config-simple-name []
  (last (re-find #"\S+/(\S+).edn" (config-name))))

(defonce defaults (-> (or (env :configdefaults) "config/defaults.edn")
                      (slurp)
                      (clojure.edn/read-string)))

(defn merge-with-defaults [config]
  (merge-with merge defaults config))

(defonce config (->> (or (env :config) "config/dev.edn")
                    (slurp)
                    (clojure.edn/read-string)
                    (merge-with-defaults)))
