(ns oph.va.schema
  (:require [schema.core :as s]))

(s/defschema AvustusHaku {:id Long
                          :content s/Any
                          :form Long
                          :submittime s/Inst})

(s/defschema HakemusId
  "Hakemus id contains id of the newly created hakemus"
  {:id s/Str})
