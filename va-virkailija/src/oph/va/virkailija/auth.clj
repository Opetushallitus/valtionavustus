(ns oph.va.virkailija.auth
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.login :refer [login]]
            [buddy.core.nonce :as nonce]
            [buddy.core.codecs :as codecs]))

(defonce tokens (atom {}))

(defn random-token []
  (let [randomdata (nonce/random-bytes 16)]
    (codecs/bytes->hex randomdata)))

(defn authenticate [username password]
  (when-let [details (login username password)]
    (let [token (random-token)]
      (swap! tokens assoc token details)
      {:username username
       :token token})))

(defn check-identity [identity]
  (if-let [{:keys [token username]} identity]
    token))
