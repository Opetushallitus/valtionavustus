(ns oph.va.config
  (:require [clojure.edn]
            [environ.core :refer [env]]))

(defonce config (-> (or (env :config) "config/prod.edn")
                    (slurp)
                    (clojure.edn/read-string)))
