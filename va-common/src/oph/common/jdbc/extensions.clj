(ns oph.common.jdbc.extensions
  "Inspired by http://hiim.tv/clojure/2014/05/15/clojure-postgres-json/. Uses cheshire instead of clojure.data.json and
   jsonb field instead of json field"
  (:require [clojure.java.jdbc :as jdbc]
            [cheshire.core :as json]
            [oph.common.jdbc.enums :refer :all])
  (:import org.postgresql.util.PGobject))

(extend-protocol jdbc/ISQLValue
  clojure.lang.IPersistentCollection
  (sql-value [value]
    (doto (PGobject.)
      (.setType "jsonb")
      (.setValue (json/generate-string value))))

  oph.common.jdbc.enums.HakuStatus
  (sql-value [value]
    (doto (PGobject.)
      (.setType "haku_status")
      (.setValue (.value value))))

  clojure.lang.Keyword
  (sql-value [value]
    (doto (PGobject.)
      (.setType "status")
      (.setValue (name value)))))

(extend-protocol jdbc/IResultSetReadColumn
  PGobject
  (result-set-read-column [pgobj metadata idx]
    (let [type  (.getType pgobj)
          value (.getValue pgobj)]
      (case type
        "jsonb" (json/parse-string value true)
        :else value))))

