(ns oph.va.jdbc.enums)

(gen-class
  :state value
  :init init
  :main false
  :constructors {[String] []}
  :name oph.va.jdbc.enums.HakuStatus)

(gen-class
  :state value
  :init init
  :main false
  :constructors {[String] []}
  :name oph.va.jdbc.enums.HakuRole)

(defn -init [value]
  [[] value])
