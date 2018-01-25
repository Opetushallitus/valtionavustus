(ns oph.va.environment
  (:require [oph.soresu.common.config :refer [config config-simple-name]]))

(defn get-content []
  (let [common-environment {:name (config-simple-name)
                            :show-name (:show-environment? (:ui config))
                            :hakija-server {:url (:url (:server config))}
                            :virkailija-server {:url (:virkailija-url (:server config))}
                            :paatos-path (:paatos-path (:ui config))
                            :payments (:payments config)}
        opintopolku (:opintopolku config)]
    (if-let [opintopolku-url (:url opintopolku)]
      (assoc common-environment :opintopolku {:url opintopolku-url
                                              :permission-request (:permission-request opintopolku)})
      common-environment)))
