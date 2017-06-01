(ns oph.va.hakija.notification-formatter-spec
  (use [clojure.tools.trace :only [trace]]
       [clojure.pprint :only [pprint]])
  (:require
    [speclj.core :refer :all]
    [oph.va.hakija.notification-formatter :refer :all]))

(def primary-email "primary@example.com")

(def organization-email "organization@example.com")

(def signature-email "signature@example.com")

(def answers-with-old-fields
  {:value
   [{:key "primary-email" :value primary-email :fieldType "emailField"}
    {:key "language" :value "fi" :fieldType "radioButton"}
    {:key "combined-effort" :value "no"  :fieldType "radioButton"}
    {:key "organization" :value "Our test organization" :fieldType "textField"}
    {:key "organization-email" :value organization-email :fieldType "emailField"}
    {:key "signature-email" :value signature-email :fieldType "emailField"}
    {:key "project-description"
     :value
     [{:key "project-description-1"
       :value
       [{:key "project-description.project-description-1.goal"
         :value "Integrate new learners"
         :fieldType "textField"}
        {:key "project-description.project-description-1.activity"
         :value "Opinion polls and newspaper ads"
         :fieldType "textField"}
        {:key "project-description.project-description-1.result"
         :value "More interested people"
         :fieldType "textField"}]
       :fieldType "growingFieldsetChild"}]
     :fieldType "growingFieldset"}
    ]})

(def first-repeat-signatory-email "first.repeated@signatory.example.com")

(def second-repeat-signatory-email "second.repeated@signatory.example.com")

(def answers-with-email-notification-fields
  {:value
   [{:key "primary-email" :value primary-email :fieldType "emailField"}
    {:key "language" :value "fi" :fieldType "radioButton"}
    {:key "combined-effort" :value "no"  :fieldType "radioButton"}
    {:key "organization" :value "Our test organization" :fieldType "textField"}
    {:key "organization-email" :value organization-email :fieldType "emailField"}
    {:key "signature-email" :value signature-email :fieldType "emailField"}
    {:key "signatories-fieldset"
     :value
     [{:key "signatories-fieldset-1"
       :value
       [{:key "signatories-fieldset.signatories-fieldset-1.name"
         :value "First Repeatedsignatory"
         :fieldType "textField"}
        {:key "signatories-fieldset.signatories-fieldset-1.email"
         :value first-repeat-signatory-email
         :fieldType "vaEmailNotification"}]
       :fieldType "growingFieldsetChild"}
      {:key "signatories-fieldset-2"
       :value
       [{:key "signatories-fieldset.signatories-fieldset-2.name"
         :value "Second Repeatedsignatory"
         :fieldType "textField"}
        {:key "signatories-fieldset.signatories-fieldset-2.email"
         :value second-repeat-signatory-email
         :fieldType "vaEmailNotification"}]
       :fieldType "growingFieldsetChild"}]
     :fieldType "growingFieldset"}
    {:key "project-description"
     :value
     [{:key "project-description-1"
       :value
       [{:key "project-description.project-description-1.goal"
         :value "Integrate new learners"
         :fieldType "textField"}
        {:key "project-description.project-description-1.activity"
         :value "Opinion polls and newspaper ads"
         :fieldType "textField"}
        {:key "project-description.project-description-1.result"
         :value "More interested people"
         :fieldType "textField"}]
       :fieldType "growingFieldsetChild"}]
     :fieldType "growingFieldset"}
    ]})

(def hakemus-key "f95d23ff1757c1ec79940c4b028de4372480e75ea0c84d6a26c98b411fac4d3e")

(def submitted-hakemus
  {:user_key hakemus-key
   :organization_name "Our test organization"
   :language "fi"})

(def haku-id 10)

(def haku-start "2015-10-08T09:52:00.000Z")
(def haku-end "2015-12-08T11:52:35.317Z")

(def avustushaku
  {:id haku-id
   :content
   {:name
    {:fi "Our test grant"
     :sv "Stöd för test"}
    :duration
    {:start haku-start
     :end haku-end
     :label {:fi "Hakuaika" :sv "Ansökningstid"}}}})

(defn fake-sender [is-change-request-response?
                   language
                   to
                   haku-id
                   haku-title
                   user-key
                   haku-start-date
                   haku-end-date]
  {:language language
   :to to
   :haku-id haku-id
   :haku-title haku-title
   :user-key user-key
   :haku-start-date haku-start-date
   :haku-end-date haku-end-date})

(describe "Answers with legacy email fields"
  (tags :server)

  (it "Sends notification email to all given emails"
      (let [sent-data (send-submit-notifications! fake-sender false answers-with-old-fields submitted-hakemus avustushaku )]
        (should= :fi (:language sent-data))
        (should= [primary-email organization-email signature-email] (:to sent-data))
        (should= hakemus-key (:user-key sent-data))
        (should= haku-id (:haku-id sent-data)))))

(describe "Answers with vaEmailNotification fields"
  (tags :server)

  (it "Sends notification email to all given emails"
      (let [sent-data (send-submit-notifications! fake-sender false answers-with-email-notification-fields submitted-hakemus avustushaku )]
        (should= :fi (:language sent-data))
        (should= [primary-email
                  organization-email
                  signature-email
                  first-repeat-signatory-email
                  second-repeat-signatory-email] (:to sent-data))
        (should= hakemus-key (:user-key sent-data))
        (should= haku-id (:haku-id sent-data)))))

(run-specs)
