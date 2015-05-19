(ns oph.va.jdbc.jsonb
  "Inspired by http://hiim.tv/clojure/2014/05/15/clojure-postgres-json/. Uses cheshire instead of clojure.data.json and
   jsonb field instead of json field"
  (:require [clojure.java.jdbc :as jdbc]
            [cheshire.core :as json])
  (:import org.postgresql.util.PGobject))

(defn value-to-json-pgobject [value]
  (doto (PGobject.)
    (.setType "json")
    (.setValue (json/generate-string value))))

(extend-protocol jdbc/ISQLValue
  clojure.lang.IPersistentMap
  (sql-value [value] (value-to-json-pgobject value))

  clojure.lang.IPersistentVector
  (sql-value [value] (value-to-json-pgobject value)))

(extend-protocol jdbc/IResultSetReadColumn
  PGobject
  (result-set-read-column [pgobj metadata idx]
    (let [type  (.getType pgobj)
          value (.getValue pgobj)]
      (case type
        "jsonb" (json/parse-string value true)
        :else value))))
