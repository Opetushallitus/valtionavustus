(ns oph.common.jdbc.enums
  (:gen-class
    :state value
    :init init
    :constructors {[String] []}
    :name oph.common.jdbc.enums.HakuStatus
    :implements [[value [] String]]))

(defn -init [value]
  [[] value])

(defn -value [this]
  (.state this))
