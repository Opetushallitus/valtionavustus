(ns oph.form.schema
  (:require [schema.core :as s]))

(defn create-form-schema [custom-wrapper-element-types]
  (s/defschema LocalizedString {:fi s/Str
                                :sv s/Str})

  (s/defschema Option {:value s/Str
                       (s/optional-key :label) LocalizedString})

  (s/defschema InfoElement {:type (s/eq "infoElement")
                            :id s/Str
                            :displayAs (s/enum :h1
                                               :p
                                               :bulletList
                                               :dateRange
                                               :endOfDateRange)
                            (s/optional-key :params) s/Any
                            (s/optional-key :label) LocalizedString
                            (s/optional-key :text) LocalizedString})

  (s/defschema Button {:type (s/eq "button")
                       :id s/Str
                       (s/optional-key :label) LocalizedString
                       (s/optional-key :params) s/Any
                       :displayAs s/Keyword})

  (s/defschema FormField {:type (s/eq "formField")
                          :id s/Str
                          :required s/Bool
                          (s/optional-key :label) LocalizedString
                          (s/optional-key :helpText) LocalizedString
                          (s/optional-key :params) s/Any
                          (s/optional-key :options) [Option]
                          :displayAs (s/enum :textField
                                             :textArea
                                             :emailField
                                             :moneyField
                                             :finnishBusinessIdField
                                             :dropdown
                                             :radioButton)})

  (s/defschema BasicElement (s/either FormField
                                      Button
                                      InfoElement))

  (let [default-wrapper-element-types [:theme :fieldset :growingFieldset :growingFieldsetChild ]
        wrapper-element-types (into custom-wrapper-element-types default-wrapper-element-types)]
    (s/defschema WrapperElement {:type                    (s/eq "wrapperElement")
                                 :id                      s/Str
                                 :displayAs               (apply s/enum wrapper-element-types )
                                 :children                [(s/either BasicElement
                                                                     (s/recursive #'WrapperElement))]
                                 (s/optional-key :params) s/Any
                                 (s/optional-key :label)  LocalizedString}))

  (s/defschema Content [(s/either BasicElement
                                  WrapperElement)])

  (s/defschema Form {:id Long,
                     :content Content,
                     :created_at s/Inst})

  (s/defschema Answer {:key s/Str,
                       :value (s/either s/Str
                                        [(s/recursive #'Answer)])})

  (s/defschema Answers
    "Answers consists of a key (String) value pairs, where value may be String or an array of more answers"
    { :value [Answer] })

  (s/defschema Submission {:id Long
                           :created_at s/Inst
                           :form Long
                           :version Long
                           :version_closed (s/maybe s/Inst)
                           :answers Answers})

  (s/defschema SubmissionValidationErrors
    "Submission validation errors contain a mapping from field id to list of validation errors"
    {s/Keyword [s/Str]}))