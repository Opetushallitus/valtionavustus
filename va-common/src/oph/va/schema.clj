(ns oph.va.schema
  (:require [schema.core :as s]
              [oph.form.schema :refer :all]))

(create-form-schema [:vaBudget
                     :vaSummingBudgetElement
                     :vaBudgetItemElement
                     :vaBudgetSummaryElement
                     :vaProjectDescription]
                    [:vaFocusAreas
                     :vaEmailNotification])

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
                          :hakija-server {:url LocalizedString}})

(s/defschema HakuStatus
  (s/enum "new" "draft" "published" "deleted"))

(s/defschema HakuPhase
  (s/enum "unpublished" "upcoming" "current" "ended"))

(s/defschema AvustusHaku {:id Long
                          :status HakuStatus
                          :phase HakuPhase
                          :register-number (s/maybe s/Str)
                          :content AvustusHakuContent
                          :form Long})

(s/defschema HakemusStatus
  "Status from the application point of view"
  (s/enum "new" "draft" "submitted"))

(s/defschema Attachment
  "Attachment metadata"
  {:id Long
   :hakemus-id s/Str
   :version Long
   (s/optional-key :version-closed) s/Inst
   (s/optional-key :created-at) s/Inst
   :field-id s/Str
   :file-size Long
   :content-type s/Str
   :hakemus-version Long
   :filename s/Str})
