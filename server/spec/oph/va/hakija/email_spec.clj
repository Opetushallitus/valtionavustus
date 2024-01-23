(ns oph.va.hakija.email-spec
  (:use [clojure.tools.trace])
  (:require [speclj.core
             :refer [describe tags around-all it should should= run-specs]]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.hakija.server :refer [start-hakija-server]]
            [oph.va.hakija.email :as va-email]
            [oph.va.hakija.db :as va-db]))

(def test-server-port 9000)
(def base-url (str "http://localhost:" test-server-port))

(describe
  "Email generate functions"

  (tags :server :email)

  (around-all
    [_]
    (with-test-server!
      "hakija"
      #(start-hakija-server "localhost" test-server-port false) (_)))

  (it "generates refused email for presenter"
      (let [grant (first (va-db/list-avustushaut))
            email (va-email/generate-presenter-refused-email
                    ["presenter@local"] grant 10)]
        (prn (get-in grant [:content :name :fi]))
        (should=
         (sorted-map
           :operation :send
           :email-type :application-refused-presenter
           :lang :fi
           :from "no-reply@valtionavustukset.oph.fi"
           :sender "no-reply@csc.fi"
           :subject "Automaattinen viesti: Avustuksen saajan ilmoitus"
           :to ["presenter@local"]
           :grant-name (get-in grant [:content :name :fi]))
         (into (sorted-map) (dissoc email :url)))
        (should (some? (:url email))))))

(run-specs)
