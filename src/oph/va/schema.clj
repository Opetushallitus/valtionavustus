(ns oph.va.schema
  (:require [schema.core :as s]))

(s/defschema AvustusHaku {:id Long
                          :content s/Any
                          :form Long
                          :created_at s/Inst})

(s/defschema HakemusId
  "Hakemus id contains id of the newly created hakemus"
  {:id s/Str})
