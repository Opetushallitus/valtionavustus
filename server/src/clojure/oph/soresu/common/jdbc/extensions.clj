(ns oph.soresu.common.jdbc.extensions
  "Inspired by http://hiim.tv/clojure/2014/05/15/clojure-postgres-json/. Uses cheshire instead of clojure.data.json and
   jsonb field instead of json field"
  (:require [clojure.java.jdbc :as jdbc]
            [cheshire.core :as json])
  (:import org.postgresql.util.PGobject [java.time LocalDate] ))

(extend-protocol jdbc/ISQLValue
  clojure.lang.IPersistentCollection
  (sql-value [value]
    (doto (PGobject.)
      (.setType "jsonb")
      (.setValue (json/generate-string value)))))

(extend-protocol jdbc/IResultSetReadColumn
 java.sql.Date
 (result-set-read-column [v _ _]
                         (.toLocalDate v))
  PGobject
  (result-set-read-column [pgobj metadata idx]
    (let [type  (.getType pgobj)
          value (.getValue pgobj)]
      (case type
        "jsonb" (json/parse-string value true)
        value))))
