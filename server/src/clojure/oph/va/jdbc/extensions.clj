(ns oph.va.jdbc.extensions
  (:require [clojure.java.jdbc :as jdbc]
            [oph.soresu.common.jdbc.extensions :refer :all]
            [oph.va.jdbc.enums])
  (:import (org.postgresql.util PGobject)
           (oph.va.jdbc.enums HakuStatus HakuRole HakuType)))

(defn is-status-enum? [value] (some #(= value %) [:new :draft :submitted :pending_change_request :officer_edit :cancelled :applicant_edit]))
(defn is-arviostatus-enum? [value] (some #(= value %) [:unhandled :processing :plausible :rejected :accepted]))

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
    (let [type (cond (is-status-enum? value) "status"
                     (is-arviostatus-enum? value) "arvio_status"
                     :else (throw (Error. (str "Cannot convert keyword " value " to enum type"))))]
      (doto (PGobject.)
        (.setType type)
        (.setValue (name value))))))
