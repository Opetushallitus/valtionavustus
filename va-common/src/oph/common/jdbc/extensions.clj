(ns oph.common.jdbc.extensions
  "Inspired by http://hiim.tv/clojure/2014/05/15/clojure-postgres-json/. Uses cheshire instead of clojure.data.json and
   jsonb field instead of json field"
  (:require [clojure.java.jdbc :as jdbc]
            [cheshire.core :as json])
  (:import org.postgresql.util.PGobject))

(defn value-to-jsonb-pgobject [value]
  (doto (PGobject.)
    (.setType "jsonb")
    (.setValue (json/generate-string value))))

(defn value-to-status [value]
  (doto (PGobject.)
    (.setType "status")
    (.setValue (name value))))

(extend-protocol jdbc/ISQLValue
  clojure.lang.IPersistentCollection
  (sql-value [value]
    (value-to-jsonb-pgobject value))

  clojure.lang.Keyword
  (sql-value [value] (value-to-status value)))

(extend-protocol jdbc/IResultSetReadColumn
  PGobject
  (result-set-read-column [pgobj metadata idx]
    (let [type  (.getType pgobj)
          value (.getValue pgobj)]
      (case type
        "status" (keyword value)
        "jsonb" (json/parse-string value true)
        :else value))))

