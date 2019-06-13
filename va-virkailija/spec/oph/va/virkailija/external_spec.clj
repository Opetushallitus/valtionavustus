(ns oph.va.virkailija.external-spec
  (require [speclj.core
            :refer [should should-not should= describe
                    it tags around-all run-specs]]
           [oph.common.testing.spec-plumbing :refer [with-test-server!]]
           [oph.va.virkailija.server :refer [start-server]]
           [oph.va.virkailija.external-data :as external-data]
           [oph.va.virkailija.application-data :as application-data]
           [oph.va.virkailija.payments-data :as payments-data]
           [oph.va.virkailija.common-utils
            :refer [test-server-port create-submission create-application
                    create-application-evaluation]]))

(describe "Queries for external APIs"
  (tags :external)

  (around-all [_] (with-test-server! :virkailija-db
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false}) (_)))

  (it "returns grants for given year"
    (should= 2 (count (external-data/get-grants-for-year 2015)))
    (should= 0 (count (external-data/get-grants-for-year 2019)))
  ))

(run-specs)
