(ns oph.va.virkailija.paatos-spec
  (require [speclj.core
            :refer [should should-not should= describe
                    it tags around-all run-specs before after]]
           [oph.common.testing.spec-plumbing :refer [with-test-server!]]
           [oph.va.virkailija.server :refer [start-server]]
           [oph.va.virkailija.common-utils
            :refer [test-server-port create-evaluation
                    create-application create-submission
                    create-application-evaluation]]
           [oph.va.virkailija.grant-data :as grant-data]
           [oph.va.virkailija.paatos :as paatos]
           [oph.va.virkailija.db :as virkailija-db]
           [oph.va.hakija.api :as hakija-api]))

(describe
  "Paatos functions"

  (tags :paatos)

  (around-all [_] (with-test-server! :virkailija-db
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false
                        :without-authentication? true}) (_)))

  (before
    (virkailija-db/set-all-evaluations-unhandled)
    (hakija-api/cancel-all-applications))

  (after
    (virkailija-db/set-all-evaluations-unhandled)
    (hakija-api/cancel-all-applications))

  (it "gets no email statuses"
      (let [grant (first (grant-data/get-grants))]
        (should (empty? (paatos/get-paatos-email-status (:id grant))))))

  (it "gets email statuses"
      (let [grant (first (grant-data/get-grants))]
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "rejected")
        (create-evaluation grant "unhandled")
        (create-evaluation grant "plausible")
        (should= 4 (count (paatos/get-paatos-email-status (:id grant))))
        (prn (paatos/get-paatos-email-status (:id grant)))))

  (it "filters refused email statuses"
      (let [grant (first (grant-data/get-grants))]
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (let [submission (create-submission (:form grant) {})
              application (create-application grant submission)
              evaluation (create-application-evaluation application "accepted")]
          (hakija-api/set-application-refused
            (:user_key application) (:id submission) ""))

        (create-evaluation grant "rejected")

        (should= 4 (count (paatos/get-paatos-email-status (:id grant))))))

  (it "gets hakemus ids to send"
      (let [grant (first (grant-data/get-grants))
            application-ids
            (sorted-set
              (:hakemus_id (create-evaluation grant "accepted"))
              (:hakemus_id (create-evaluation grant "accepted"))
              (:hakemus_id (create-evaluation grant "accepted"))
              (:hakemus_id (create-evaluation grant "rejected")))]
        (should= application-ids
                 (apply sorted-set (paatos/get-hakemus-ids-to-send (:id grant))))))

  (it "gets hakemus ids excluding refused ones to send"
      (let [grant (first (grant-data/get-grants))
            application-ids
            (sorted-set
              (:hakemus_id (create-evaluation grant "accepted"))
              (:hakemus_id (create-evaluation grant "accepted"))
              (:hakemus_id (create-evaluation grant "accepted"))
              (:hakemus_id (create-evaluation grant "rejected")))]
        (let [submission (create-submission (:form grant) {})
              application (create-application grant submission)
              evaluation (create-application-evaluation
                           application "accepted")]
          (hakija-api/set-application-refused
            (:user_key application)
            (:id submission) ""))
        (should= application-ids
                 (apply sorted-set (paatos/get-hakemus-ids-to-send (:id grant)))))))

(comment '
  ({:id 98, :version 0, :project-name "Test Project", :organization-name "Test Organisation", :sent-emails nil, :view_count 0, :user_key "95500db2-5b8f-494a-8d9c-c9c3e1418ea9", :sent-time nil}
   {:id 99, :version 0, :project-name "Test Project", :organization-name "Test Organisation", :sent-emails nil, :view_count 0, :user_key "a0cc5941-8155-43e5-b781-96232f543caa", :sent-time nil}
   {:id 100, :version 0, :project-name "Test Project", :organization-name "Test Organisation", :sent-emails nil, :view_count 0, :user_key "516bea33-f2eb-41ed-9c99-e0eca03e14cb", :sent-time nil}
   {:id 101, :version 0, :project-name "Test Project", :organization-name "Test Organisation", :sent-emails nil, :view_count 0, :user_key "e32ce0a0-48eb-41ae-b850-f99950b02bf7", :sent-time nil}))
