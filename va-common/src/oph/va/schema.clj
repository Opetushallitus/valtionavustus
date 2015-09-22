(ns oph.va.schema
  (:require [schema.core :as s]
              [oph.form.schema :refer :all]))

(create-form-schema [:vaBudget
                     :vaSummingBudgetElement
                     :vaBudgetItemElement
                     :vaBudgetSummaryElement
                     :vaProjectDescription])

(s/defschema Duration {:label LocalizedString
                       :start s/Inst
                       :end s/Inst})

(s/defschema SelectionCriteria {:label LocalizedString
                                :items [LocalizedString]})

(s/defschema AvustusHakuContent {:name LocalizedString
                                 :duration Duration
                                 :selection-criteria SelectionCriteria
                                 :self-financing-percentage s/Num})

(s/defschema Environment {:name s/Str
                          :show-name s/Bool})

(s/defschema HakuStatus
  (s/enum "new" "draft" "published" "deleted"))

(s/defschema AvustusHaku {:id Long
                          :status HakuStatus
                          :content AvustusHakuContent
                          :form Long})

(s/defschema HakemusStatus
  "Status from the application point of view"
  (s/enum "new" "draft" "submitted"))
