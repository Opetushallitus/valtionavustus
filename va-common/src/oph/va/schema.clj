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
                                 :selection-criteria SelectionCriteria
                                 :self-financing-percentage s/Num})

(s/defschema Environment {:name s/Str
                          :show-name s/Bool})

(s/defschema AvustusHaku {:id Long
                          :content AvustusHakuContent
                          :form Long
                          :environment Environment})
