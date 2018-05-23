(ns oph.va.virkailija.virkailija-tools
  (:require [yesql.core :refer [defquery]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.soresu.common.db :refer [exec exec-all]]))

(defquery set-all-unhandled! "sql/virkailija/arvio/set-all-unhandled.sql")
