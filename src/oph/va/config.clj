(ns oph.va.config
  (:require [clojure.edn]
            [environ.core :refer [env]]))

(defn config-name [] (env :config))

(defonce config (-> (or (env :config) "config/dev.edn")
                    (slurp)
                    (clojure.edn/read-string)))
