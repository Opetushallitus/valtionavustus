(ns oph.common.jdbc.enums)

(gen-class
  :state value
  :init init
  :main false
  :constructors {[String] []}
  :name oph.common.jdbc.enums.HakuStatus)

(gen-class
  :state value
  :init init
  :main false
  :constructors {[String] []}
  :name oph.common.jdbc.enums.HakuRole)

(defn -init [value]
  [[] value])
