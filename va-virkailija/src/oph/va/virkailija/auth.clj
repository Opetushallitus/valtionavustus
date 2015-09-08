(ns oph.va.virkailija.auth
  (:require [oph.va.virkailija.login :refer [login]]))

(defonce tokens (atom {}))

(defn authenticate [username password]
  (login username password))
