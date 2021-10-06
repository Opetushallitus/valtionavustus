(ns oph.va.environment
  (:require [oph.soresu.common.config :refer [config config-simple-name]]
            [oph.soresu.common.db :as db]
            [oph.va.db.queries :as queries]))

(defn get-notice []
  (-> (db/exec queries/get-environment-notice {})
      first
      :notice))

(defn get-content []
  (let [common-environment
        {:name (config-simple-name)
         :show-name (:show-environment? (:ui config))
         :hakija-server {:url (:url (:server config))}
         :virkailija-server {:url (:virkailija-url (:server config))}
         :paatos-path (:paatos-path (:ui config))
         :payments (:payments config)
         :notice (get-notice)
         :application-change {:refuse-enabled? true}
         :multibatch-payments (:multibatch-payments config)
         :reports (:reports config)
         :va-code-values (:va-code-values config)
         :muutoshakemus-osiokohtainen-hyvaksynta (:muutoshakemus-osiokohtainen-hyvaksynta config)
         :allow-overriding-feature-flag-from-url-params (:allow-overriding-feature-flag-from-url-params config)
         :selvitys-limit (:selvitys-limit config)}
        opintopolku (:opintopolku config)]
    (if-let [opintopolku-url (:url opintopolku)]
      (assoc common-environment :opintopolku {:url opintopolku-url
                                              :permission-request (:permission-request opintopolku)})
      common-environment)))
