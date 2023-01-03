(ns oph.va.virkailija.hakija-api-spec
  (:use [clojure.tools.trace :only [trace]]
       [clojure.pprint :only [pprint]])
  (:require
    [speclj.core :refer :all]
    [oph.va.hakija.api :refer :all]
    [oph.va.virkailija.utils :refer [convert-to-underscore-keys convert-to-dash-keys]]))

(def payments-with-dash
  [{:amount 2000 :application-id 41 :takp-account "521"
    :grant-id 3 :paymentstatus-id "created" :lkp-account "" :currency "EUR"
    :application-version 1 :long-ref "1234"}
   {:amount 4000 :transaction-account "12345" :application-id 40 :takp-account "518"
    :grant-id 2 :paymentstatus-id "waiting" :lkp-account "214" :document-type "XA" :currency "EUR"
    :application-version 1 :long-ref "12345"}])

(def payments-with-underscore
  [{:amount 3000 :application_id 41 :takp_account "521"
    :grant_id 3 :paymentstatus_id "created" :lkp_account "" :currency "EUR"
    :application_version 1 :long_ref "1234"}
   {:amount 2500 :application_id 40 :takp_account "518"
    :grant_id 2 :paymentstatus_id "waiting" :lkp_account "214" :currency "EUR"
    :application_version 1 :long_ref "12345"}])

(describe
  "Testing key conversion functions"
  (tags :server)
  (it
    "Converts keys with underscore to keys with dash without changing data"
    (let [c (convert-to-underscore-keys (first payments-with-dash))]
      (should= (:application_version c) 1)))
  (it
    "Converts keys with underscore to keys with dash without changing other
    keys"
    (let [c (convert-to-underscore-keys (first payments-with-dash))]
      (should= (:amount c) 2000)))
  (it
    "Converts keys with dash to keys with underscore without changing data"
    (let [c (convert-to-dash-keys (first payments-with-underscore))]
      (should= (:application-version c) 1)))
  (it
    "Converts keys with dash to keys with underscore without changing other
    keys"
    (let [c (convert-to-dash-keys (first payments-with-underscore))]
      (should= (:amount c) 3000)))
  (it
    "Converts back and forth keys with dash"
    (should=
      (second payments-with-dash)
      (convert-to-dash-keys
        (convert-to-underscore-keys (second payments-with-dash))))))
