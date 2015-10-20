(ns oph.va.hakija.notification-formatter-spec
  (use [clojure.tools.trace :only [trace]]
       [clojure.pprint :only [pprint]])
  (:require
    [speclj.core :refer :all]
    [oph.va.hakija.notification-formatter :refer :all]))

(def primary-email "primary@example.com")

(def organization-email "organization@example.com")

(def signature-email "signature@example.com")

(def answers
  {:value
   [{:key "primary-email" :value primary-email}
    {:key "language" :value "fi"}
    {:key "combined-effort" :value "no"}
    {:key "organization" :value "Our test organization"}
    {:key "organization-email" :value organization-email}
    {:key "signature-email" :value signature-email}
    {:key "project-description"
     :value
     [{:key "project-description-1"
       :value
       [{:key "project-description.project-description-1.goal"
         :value "Integrate new learners"}
        {:key "project-description.project-description-1.activity"
         :value "Opinion polls and newspaper ads"}
        {:key "project-description.project-description-1.result"
         :value "More interested people"}]}]}
    ]})

(def hakemus-key "f95d23ff1757c1ec79940c4b028de4372480e75ea0c84d6a26c98b411fac4d3e")

(def submitted-hakemus
  {:user_key hakemus-key
   :organization_name "Our test organization"})

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

(defn fake-sender [language
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

(describe "Form with fields with legacy email fields"

          (tags :server)

          (it "Sends notification email to all legacy fields"
            (let [sent-data (send-submit-notifications! fake-sender answers submitted-hakemus avustushaku )]
              (should= :fi (:language sent-data))
              (should= [primary-email organization-email signature-email] (:to sent-data))
              (should= hakemus-key (:user-key sent-data))
              (should= haku-id (:haku-id sent-data))
              )))

(run-specs)
