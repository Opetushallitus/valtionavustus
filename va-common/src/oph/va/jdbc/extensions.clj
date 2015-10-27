(ns oph.va.jdbc.extensions
  (:require [clojure.java.jdbc :as jdbc]
            [oph.soresu.common.jdbc.extensions :refer :all]
            [oph.va.jdbc.enums :refer :all])
  (:import org.postgresql.util.PGobject
           (org.postgresql.util PGobject)))

(extend-protocol jdbc/ISQLValue
  oph.va.jdbc.enums.HakuStatus
  (sql-value [value]
    (doto (PGobject.)
      (.setType "haku_status")
      (.setValue (.-value value))))

  oph.va.jdbc.enums.HakuRole
  (sql-value [value]
    (doto (PGobject.)
      (.setType "role")
      (.setValue (.-value value))))

  clojure.lang.Keyword
  (sql-value [value]
    (doto (PGobject.)
      (.setType "status")
      (.setValue (name value)))))
