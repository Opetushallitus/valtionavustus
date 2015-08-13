(ns oph.va.schema
  (:require [schema.core :as s]
            [oph.form.schema :refer :all]))

(s/defschema Duration {:label LocalizedString
                       :start s/Inst
                       :end s/Inst})

(s/defschema SelectionCriteria {:label LocalizedString
                                :items [LocalizedString]})

(s/defschema AvustusHakuContent {:name LocalizedString
                                 :duration Duration
                                 :duration-help LocalizedString
                                 :selection-criteria SelectionCriteria
                                 :self-financing-percentage s/Num})

(s/defschema AvustusHaku {:id Long
                          :content AvustusHakuContent
                          :form Long
                          :created_at s/Inst})
(s/defschema Hakemus
  "Hakemus contains hakemus info and last submission"
  {:id     (s/maybe s/Str)
   :status (s/enum "draft" "submitted")
   :created_at s/Inst
   :verified_at (s/maybe s/Inst)
   :submission Submission})
