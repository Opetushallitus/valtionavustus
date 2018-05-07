(ns oph.va.virkailija.reporting-data-spec
  (require [speclj.core
            :refer [should should-not should= describe it tags around-all]]
           [oph.common.testing.spec-plumbing :refer [with-test-server!]]
           [oph.va.virkailija.server :refer [start-server]]
           [oph.va.virkailija.virkailija-server-spec :as server]
           [oph.va.virkailija.reporting-data :as reporting-data]
           [oph.va.virkailija.grant-data :as grant-data]
           [oph.va.virkailija.db :as virkailija-db]
           [oph.va.hakija.api :as hakija-api]))

(def test-server-port 9001)

(defn- create-application-evaluation [application status]
   (virkailija-db/update-or-create-hakemus-arvio
       (hakija-api/get-avustushaku (:avustushaku application))
       (:id application)
       {:status status
        :overridden-answers {}
        :roles {:evaluators []}
        :perustelut nil
        :acedemy-size 0
        :costsGranted 30000
        :oppilaitokset []
        :presenter-role-id nil
        :presentercomment nil
        :rahoitusalue nil
        :seuranta-answers {}
        :should-pay true
        :should-pay-comments nil
        :summary-comment nil
        :tags {:value []}
        :talousarviotili nil}
       (:identity server/user-authentication)))

(defn- create-evaluation [grant status]
   (create-application-evaluation
     (server/create-application
       grant
       (server/create-submission
         (:form grant) {:budget-oph-share 40000}))
     status))

(describe
  "Granted sums"

  (tags :reporting :grantedsums)

  (around-all [_] (with-test-server! :virkailija-db
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false}) (_)))

  (it "gets yearly granted sums"
      (hakija-api/cancel-all-applications)
      (virkailija-db/set-all-evaluations-unhandled)
      (let [grant (first (grant-data/get-grants))]
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "rejected")
        (create-evaluation grant "rejected"))

      (should= [{:year (.getYear (java.time.LocalDate/now))
                 :budget-granted 90000
                 :costs-granted 90000}]
               (reporting-data/get-yearly-granted))))

(describe
  "Get yearly evaluations"

  (tags :reporting)

  (around-all [_] (with-test-server! :virkailija-db
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false}) (_)))

  (it "gets accepted count grouped by year"
      (hakija-api/cancel-all-applications)
      (virkailija-db/set-all-evaluations-unhandled)
      (let [grant (first (grant-data/get-grants))]
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted"))

      (should= [{:year (.getYear (java.time.LocalDate/now)) :count 3}]
               (reporting-data/get-accepted-count-by-year)))

  (it "gets accepted count grouped by year when there is updated evaluations"
      (hakija-api/cancel-all-applications)
      (virkailija-db/set-all-evaluations-unhandled)
      (let [grant (first (grant-data/get-grants))]
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (let [application
              (server/create-application
                grant (server/create-submission
                        (:form grant) {:budget-oph-share 10000}))]
          (create-application-evaluation application "unhandled")
          (create-application-evaluation application "accepted")
          (create-application-evaluation application "plausible")
          (create-application-evaluation application "rejected"))
        (let [application
              (server/create-application
                grant (server/create-submission
                        (:form grant) {:budget-oph-share 50000}))]
          (create-application-evaluation application "unhandled")
          (create-application-evaluation application "accepted")
          (create-application-evaluation application "plausible")
          (create-application-evaluation application "accepted")))

      (should= [{:year (.getYear (java.time.LocalDate/now)) :count 4}]
               (reporting-data/get-accepted-count-by-year)))

  (it "gets rejected count grouped by year when there is updated evaluations"
      (hakija-api/cancel-all-applications)
      (virkailija-db/set-all-evaluations-unhandled)
      (let [grant (first (grant-data/get-grants))]
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "rejected")
        (create-evaluation grant "rejected")
        (let [application
              (server/create-application
                grant (server/create-submission
                        (:form grant) {:budget-oph-share 25000}))]
          (create-application-evaluation application "unhandled")
          (create-application-evaluation application "accepted")
          (create-application-evaluation application "rejected")
          (create-application-evaluation application "accepted"))
        (let [application
              (server/create-application
                grant (server/create-submission
                        (:form grant) {:budget-oph-share 30000}))]
          (create-application-evaluation application "unhandled")
          (create-application-evaluation application "accepted")
          (create-application-evaluation application "rejected")
          (create-application-evaluation application "plausible")
          (create-application-evaluation application "rejected")))

      (should= [{:year (.getYear (java.time.LocalDate/now)) :count 3}]
               (reporting-data/get-rejected-count-by-year)))

  (it "gets rejected count grouped by year"
      (hakija-api/cancel-all-applications)
      (virkailija-db/set-all-evaluations-unhandled)
      (let [grant (first (grant-data/get-grants))]
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "accepted")
        (create-evaluation grant "rejected")
        (create-evaluation grant "rejected"))

      (should= [{:year (.getYear (java.time.LocalDate/now)) :count 2}]
               (reporting-data/get-rejected-count-by-year))))
