(ns oph.va.environment
  (:require [oph.soresu.common.config :refer [config config-simple-name environment get-feature-flags]]
            [oph.soresu.common.db :as db]))

(defn virkailija-url []
  (-> config :server :virkailija-url))

(defn- get-notice []
  (-> (db/query "select notice from environment where id = 1" {})
      first
      :notice))

(defn get-content []
  (let [common-environment
        {:name (config-simple-name)
         :environment environment
         :show-name (:show-environment? (:ui config))
         :hakija-server {:url (:url (:server config))}
         :virkailija-server {:url (:virkailija-url (:server config))}
         :paatos-path (:paatos-path (:ui config))
         :payments (:payments config)
         :notice (get-notice)
         :feature-flags (seq (get-feature-flags))
         :application-change {:refuse-enabled? true}
         :dont-send-loppuselvityspyynto-to-virkailija (:dont-send-loppuselvityspyynto-to-virkailija config)}
        opintopolku (:opintopolku config)]
    (if-let [opintopolku-url (:url opintopolku)]
      (assoc common-environment :opintopolku {:url opintopolku-url
                                              :permission-request (:permission-request opintopolku)})
      common-environment)))
