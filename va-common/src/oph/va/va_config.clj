(ns oph.va.va-config
  (:require [environ.core :refer [env]])
  (:use [oph.common.config :only [config-name]]))

(defn- set-default-va-secrets-location! []
  (System/setProperty "configsecrets" (str "../../valtionavustus-secret/" (config-name))))

(defn init-secret-config []
  (if (not (env :configsecrets))
    (set-default-va-secrets-location!)))
