(ns oph.va.virkailija.application-data-spec
  (require [speclj.core :refer [should should= describe it tags]]
           [oph.va.virkailija.grant-data :as grant-data]
           [oph.va.virkailija.application-data :as application-data]
           [oph.va.virkailija.virkailija-server-spec :as server]))

(describe
  "Revoke all application tokens"

  (tags :applicationtokens)

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
