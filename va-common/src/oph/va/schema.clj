(ns oph.va.schema
  (:require [schema.core :as s]
              [oph.soresu.form.schema :refer :all]))

(create-form-schema ["vaBudget"
                     "vaSummingBudgetElement"
                     "vaBudgetItemElement"
                     "vaBudgetSummaryElement"
                     "vaProjectDescription"]
                    ["vaFocusAreas"
                     "vaEmailNotification"
                     "vaTraineeDayCalculator"]
                    ["vaTraineeDayTotalCalculator"])

(s/defschema SystemTime {:system-time s/Inst})

(s/defschema Duration {:label LocalizedString
                       :start s/Inst
                       :end s/Inst})

(s/defschema LocalizedStringList {:label LocalizedString
                                  :items [LocalizedString]})

(defn- is-percentage? [number]
  (and (number? number) (>= number 0) (<= number 100)))

(s/defschema AvustusHakuContent {:name LocalizedString
                                 :duration Duration
                                 :focus-areas LocalizedStringList
                                 :selection-criteria LocalizedStringList
                                 :self-financing-percentage (s/conditional is-percentage? s/Num)})

(s/defschema Environment {:name s/Str
                          :show-name s/Bool
                          :hakija-server {:url LocalizedString}
                          (s/optional-key :opintopolku) {:url s/Str
                                                         :permission-request s/Str}})

(s/defschema HakuStatus
  (s/enum "new" "draft" "published" "resolved" "deleted"))

(s/defschema HakuPhase
  (s/enum "unpublished" "upcoming" "current" "ended"))

(s/defschema LocalizedStringOptional {
                                      (s/optional-key :fi) s/Str
                                      (s/optional-key :sv)  s/Str})

(s/defschema Liite {
                    :group s/Str
                    :id s/Str
                    }
)

(s/defschema Decision
  "Decision fields"
  {
   (s/optional-key :date) s/Str
   (s/optional-key :taustaa) LocalizedStringOptional
   (s/optional-key :maksu) LocalizedStringOptional
   (s/optional-key :kaytto) LocalizedStringOptional
   (s/optional-key :kayttooikeudet) LocalizedStringOptional
   (s/optional-key :selvitysvelvollisuus) LocalizedStringOptional
   (s/optional-key :kayttoaika) LocalizedStringOptional
   (s/optional-key :lisatiedot) LocalizedStringOptional
   (s/optional-key :myonteinenlisateksti) LocalizedStringOptional
   (s/optional-key :sovelletutsaannokset) LocalizedStringOptional
   (s/optional-key :johtaja) LocalizedStringOptional
   (s/optional-key :esittelija) LocalizedStringOptional
   (s/optional-key :hyvaksyminen) LocalizedStringOptional
   (s/optional-key :liitteet) [Liite]
  }
)
(s/defschema AvustusHaku {:id Long
                          :status HakuStatus
                          :phase HakuPhase
                          :multiple-rahoitusalue s/Bool
                          :register-number (s/maybe s/Str)
                          :content AvustusHakuContent
                          (s/optional-key :decision) Decision
                          :form Long})

(s/defschema HakemusStatus
  "Status from the applicant point of view"
  (s/enum "new" "draft" "submitted" "pending_change_request" "cancelled"))

(s/defschema Attachment
  "Attachment metadata"
  {:id Long
   :hakemus-id Long
   :version Long
   (s/optional-key :version-closed) s/Inst
   (s/optional-key :created-at) s/Inst
   :field-id s/Str
   :file-size Long
   :content-type s/Str
   :hakemus-version Long
   :filename s/Str})

(s/defschema VaSubmission {:created_at s/Inst
                           :form Long
                           :version Long
                           :version_closed (s/maybe s/Inst)
                           :answers Answers})
