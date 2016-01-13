(ns oph.va.schema
  (:require [schema.core :as s]
              [oph.soresu.form.schema :refer :all]))

(create-form-schema [:vaBudget
                     :vaSummingBudgetElement
                     :vaBudgetItemElement
                     :vaBudgetSummaryElement
                     :vaProjectDescription]
                    [:vaFocusAreas
                     :vaEmailNotification
                     :vaTraineeDayCalculator]
                    [:vaTraineeDayTotalCalculator])

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

(s/defschema AvustusHaku {:id Long
                          :status HakuStatus
                          :phase HakuPhase
                          :register-number (s/maybe s/Str)
                          :content AvustusHakuContent
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
