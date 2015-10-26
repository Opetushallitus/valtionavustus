(ns ^{:skip-aot true} oph.va.virkailija.handlers
  (:use [clojure.tools.trace :only [trace]])
  (:require [ring.util.http-response :refer :all]
            [compojure.core :refer [defroutes GET]]
            [compojure.api.sweet :refer :all]
            [oph.soresu.common.config :refer [config config-simple-name]]
            [oph.common.datetime :as datetime]
            [oph.va.virkailija.db :as virkailija-db]))
