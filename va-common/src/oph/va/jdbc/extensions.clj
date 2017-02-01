(ns oph.va.jdbc.extensions
  (:require [clojure.java.jdbc :as jdbc]
            [oph.soresu.common.jdbc.extensions :refer :all]
            [oph.va.jdbc.enums])
  (:import (org.postgresql.util PGobject)
           (oph.va.jdbc.enums HakuStatus HakuRole HakuType)))

(extend-protocol jdbc/ISQLValue
  HakuStatus
  (sql-value [value]
    (doto (PGobject.)
      (.setType "haku_status")
      (.setValue (.-value value))))

  HakuRole
  (sql-value [value]
    (doto (PGobject.)
      (.setType "role")
      (.setValue (.-value value))))

  HakuType
  (sql-value [value]
    (doto (PGobject.)
      (.setType "haku_type")
      (.setValue (.-value value))))

  clojure.lang.Keyword
  (sql-value [value]
    (doto (PGobject.)
      (.setType "status")
      (.setValue (name value)))))
