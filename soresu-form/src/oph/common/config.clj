(ns oph.common.config
  (:require [clojure.edn]
            [environ.core :refer [env]]
            [clojure.tools.logging :as log]))

(defn config-name [] (env :config))

(defn config-simple-name []
  (last (re-find #"\S+/(\S+).edn" (config-name))))

(defonce defaults (-> (or (env :configdefaults) "config/defaults.edn")
                      (slurp)
                      (clojure.edn/read-string)))

(defn- slurp-if-found [path]
  (try
    (slurp path)
    (catch Exception e
      (log/warn (str "Could not read configuration from '" path "'"))
      "{}")))

(defonce secrets (->  (or (env :configsecrets) (str "../../valtionavustus-secret/" (config-name)))
                      (slurp-if-found)
                      (clojure.edn/read-string)))

(defn- merge-with-defaults [config]
  (merge-with merge defaults config))

(defn- merge-with-secrets [config]
  (merge-with merge secrets config))

(defonce config (->> (or (env :config) "config/dev.edn")
                    (slurp)
                    (clojure.edn/read-string)
                    (merge-with-defaults)
                    (merge-with-secrets)))
