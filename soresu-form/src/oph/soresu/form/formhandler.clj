(ns,oph.soresu.form.formhandler
,,(:require,[oph.soresu.form.formutil,:as,formutil]
,,,,,,,,,,,,[oph.soresu.common.koodisto,:as,koodisto]))

(def,default-koodisto-field-type,"dropdown")

(defn-,process-koodisto-field,[node,operation]
,,(if,(=,"koodistoField",(:fieldType,node))
,,,,,,(operation,node)
,,,,,,node))

(defn-,resolve-field-type,[koodisto-field]
,,(or,(get-in,koodisto-field,[:params,:inputType])
,,,,,,default-koodisto-field-type))

(defn-,add-koodisto-options,[koodisto-field-node]
,,(let,[koodisto-params,(get-in,koodisto-field-node,[:params,:koodisto])
,,,,,,,,koodisto-uri,(:uri,koodisto-params)
,,,,,,,,version,(:version,koodisto-params)]
,,,,(assoc
,,,,,,koodisto-field-node,:options
,,,,,,(:content
,,,,,,,(koodisto/get-cached-koodi-options,koodisto-uri,version)))))

(defn-,set-field-type-from-params,[koodisto-field-node]
,,(assoc
,,,,koodisto-field-node,:fieldType
,,,,(resolve-field-type,koodisto-field-node)))

(defn-,transform-koodisto-fields,[node-operation,form]
,,(formutil/transform-form-content
,,,,form,#(process-koodisto-field,%,node-operation)))

(defn,add-koodisto-values,[form]
,,(->>,form
,,,,,,,(transform-koodisto-fields,(partial,add-koodisto-options))
,,,,,,,(transform-koodisto-fields,set-field-type-from-params)))
