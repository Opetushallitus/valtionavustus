(ns oph.va.virkailija.va-code-values-spec
  (:require [speclj.core
             :refer [describe it should should-not should=
                     tags around-all run-specs]]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.virkailija.server :refer [start-server]]
            [oph.va.virkailija.va-code-values-routes :refer [has-privilege?]]
            [oph.va.virkailija.va-code-values-data :as data]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.grant-data :as grant-data]
            [clj-time.coerce :as c]
            [oph.va.virkailija.common-utils
             :refer [user-authentication post! add-mock-authentication
                     remove-mock-authentication]]))

(def test-server-port 9001)

(def valid-va-code-value
  {:value-type "operational-unit"
   :year 2018
   :code "1234567890"
   :code-value "Example value"})

(describe "Checking privileges"

          (tags :vacodevalues)

          (it "has privilege"
              (should (has-privilege?
                        {:privileges '("va-user" "va-admin")}
                        "va-user")))
          (it "has privilege"
              (should (has-privilege?
                        {:privileges '("va-user" "va-admin")}
                        "va-admin")))
          (it "does not have a privilege"
              (should (not (has-privilege?
                             {:privileges '("va-user")}
                             "va-admin"))))
          (it "handles empty privileges"
              (should (not (has-privilege?
                             {:privileges '()}
                             "va-admin"))))
          (it "handles empty identity"
              (should (not (has-privilege? {} "va-admin"))))
          (it "handles nil identity"
              (should (not (has-privilege? nil "va-admin")))))

(describe "VA code values routes for non-admin"

  (tags :server :vacodevalues)

  (around-all
    [_]
    (add-mock-authentication user-authentication)
    (with-test-server!
      "virkailija"
      #(start-server
         {:host "localhost"
          :port test-server-port
          :auto-reload? false
          :without-authentication? true}) (_))
    (remove-mock-authentication user-authentication))

  (it "denies of non-admin create code value"
      (let [{:keys [status body]}
            (post! "/api/v2/va-code-values/" valid-va-code-value)]
        (should= 401 status)<
        (should (empty? body)))))

(describe
  "Get and find payments"

  (tags :vacodevalues)

  (around-all [_] (with-test-server! "virkailija"
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false
                        :without-authentication? true}) (_)))

  (it "checks code usage when no code is used"
      (let [code (data/create-va-code-value
                   {:value-type "operational-unit"
                    :year 2018
                    :code "1234567"
                    :code-value "Some value"})]
        (should-not (data/code-used? (:id code)))))

  (it "checks code usage when code is used"
      (let [code (data/create-va-code-value
                   {:value-type "operational-unit"
                    :year 2018
                    :code "1234567"
                    :code-value "Some value"})
            sdf (java.text.SimpleDateFormat. "yyyy-MM-dd")]
        (->
          (grant-data/get-grants)
          first
          :id
          (hakija-api/get-avustushaku)
          (assoc :operational-unit-id (:id code)
                 :hankkeen-paattymispaiva (c/to-sql-date (.parse sdf "4200-04-20"))
                 :hankkeen-alkamispaiva (c/to-sql-date (.parse sdf "1969-04-20"))
                 :haku-type "yleisavustus")
          hakija-api/update-avustushaku)
        (should (data/code-used? (:id code))))))

(run-specs)
