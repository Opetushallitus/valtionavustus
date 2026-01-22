(ns oph.va.virkailija.fake-authentication
  (:use [clojure.tools.trace :only [trace]]))

(def default-fake-admin-identity
  {:email "santeri.horttanainen@reaktor.com"
   :first-name "_"
   :lang "fi"
   :person-oid "1.2.246.562.24.15653262222"
   :privileges ["va-admin"]
   :surname "valtionavustus"
   :username "valtionavustus"})

(def fake-identity-paivi-paakayttaja
  {:email "paivi.paakayttaja@example.com"
   :first-name "Päivi"
   :lang "fi"
   :person-oid "1.2.246.562.24.99000000001"
   :privileges ["va-admin"]
   :surname "Pääkäyttäjä"
   :username "paivipaakayttaja"})

(def fake-identity-viivi-virkailija
  {:email "viivi.virkailja@exmaple.com"
   :first-name "Viivi"
   :lang "fi"
   :person-oid "1.2.246.562.24.99000000002"
   :privileges ["va-user"]
   :surname "Virkailija"
   :username "viivivirkailija"})

(def fake-identity-jotpa-kayttaja
  {:email "jotpa.kayttaja@jotpa.fi"
   :first-name "Jotpa"
   :lang "fi"
   :person-oid "1.2.246.562.24.99000000003"
   :privileges ["va-admin"]
   :surname "Käyttäjä"
   :username "jotpakayttaja"})

(def fake-identities
  {"valtionavustus"   default-fake-admin-identity
   "paivipaakayttaja" fake-identity-paivi-paakayttaja
   "viivivirkailija"  fake-identity-viivi-virkailija
   "jotpakayttaja"    fake-identity-jotpa-kayttaja})

(defn valid-fake-identity? [name]
  (contains? fake-identities name))

(defn get-fake-identity [session]
  (let [identity-name (:fake-identity session)]
    (if (nil? identity-name)
      default-fake-admin-identity
      (fake-identities identity-name))))