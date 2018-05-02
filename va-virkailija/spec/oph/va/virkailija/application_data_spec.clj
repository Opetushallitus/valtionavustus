(ns oph.va.virkailija.application-data-spec
  (require [speclj.core
            :refer [should should-not should= describe it tags around-all]]
           [oph.common.testing.spec-plumbing :refer [with-test-server!]]
           [oph.va.virkailija.server :refer [start-server]]
           [oph.va.virkailija.grant-data :as grant-data]
           [oph.va.virkailija.application-data :as application-data]
           [oph.va.virkailija.virkailija-server-spec :as server]))

(def test-server-port 9001)

(describe
  "Revoke all application tokens"

  (tags :applicationtokens)

  (around-all [_] (with-test-server! :virkailija-db
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false}) (_)))

  (it "revokes application token of application with active token"
      (let [grant (first (grant-data/get-grants))
            submission (server/create-submission (:form grant) {})
            application (server/create-application grant submission)
            token (application-data/get-application-token (:id application))
            revoked-tokens (application-data/revoke-application-tokens
                             (:id application))]
        (should= token (:token (first revoked-tokens)))
        (should (empty? (application-data/get-application-token
                          (:id application))))))

  (it "does not revoke any tokens when there is no tokens"
      (let [grant (first (grant-data/get-grants))
            submission (server/create-submission (:form grant) {})
            application (server/create-application grant submission)]
        (application-data/revoke-application-tokens (:id application))
        (should (empty? (application-data/get-application-token
                          (:id application))))
        (should (empty? (application-data/revoke-application-tokens
                          (:id application)))))))

(describe
  "Get applications"

  (tags :applications)

  (around-all [_] (with-test-server! :virkailija-db
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false}) (_)))

  (it "checks if application is unpaid"
      (let [grant (first (grant-data/get-grants))
            submission (server/create-submission (:form grant) {})
            application (server/create-application grant submission)]
        (should-not (application-data/is-unpaid? (:id application)))))
)
