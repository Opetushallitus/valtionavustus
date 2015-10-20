(ns oph.form.schema
  (:require [schema.core :as s]))

(defn create-form-schema [custom-wrapper-element-types custom-form-element-types]
  (s/defschema LocalizedString {:fi s/Str
                                :sv s/Str})

  (s/defschema Option {:value s/Str
                       (s/optional-key :label) LocalizedString})

  (s/defschema InfoElement {:fieldClass (s/eq "infoElement")
                            :id s/Str
                            :fieldType (s/enum :h1
                                               :p
                                               :bulletList
                                               :dateRange
                                               :endOfDateRange)
                            (s/optional-key :params) s/Any
                            (s/optional-key :label) LocalizedString
                            (s/optional-key :text) LocalizedString})

  (s/defschema Button {:fieldClass (s/eq "button")
                       :id s/Str
                       (s/optional-key :label) LocalizedString
                       (s/optional-key :params) s/Any
                       :fieldType s/Keyword})

  (let [default-form-element-types [:textField
                                    :textArea
                                    :emailField
                                    :moneyField
                                    :finnishBusinessIdField
                                    :iban
                                    :bic
                                    :dropdown
                                    :radioButton
                                    :checkboxButton
                                    :namedAttachment]
        form-element-types (into custom-form-element-types default-form-element-types)
        default-wrapper-element-types [:theme :fieldset :growingFieldset :growingFieldsetChild ]
        wrapper-element-types (into custom-wrapper-element-types default-wrapper-element-types)
        all-element-types (into form-element-types wrapper-element-types)]
    (s/defschema FormField {:fieldClass (s/eq "formField")
                            :id s/Str
                            :required s/Bool
                            (s/optional-key :label) LocalizedString
                            (s/optional-key :helpText) LocalizedString
                            (s/optional-key :initialValue) (s/either LocalizedString
                                                                     s/Int)
                            (s/optional-key :params) s/Any
                            (s/optional-key :options) [Option]
                            :fieldType (apply s/enum form-element-types)})

    (s/defschema BasicElement (s/either FormField
                                          Button
                                          InfoElement))

    (s/defschema WrapperElement {:fieldClass                    (s/eq "wrapperElement")
                                     :id                      s/Str
                                     :fieldType               (apply s/enum wrapper-element-types )
                                     :children                [(s/either BasicElement
                                                                         (s/recursive #'WrapperElement))]
                                     (s/optional-key :params) s/Any
                                     (s/optional-key :label)  LocalizedString
                                     (s/optional-key :helpText)  LocalizedString})

    (s/defschema Answer {:key s/Str,
                           :value (s/either s/Str
                                            s/Int
                                            [s/Str]
                                            [(s/recursive #'Answer)])
                           :fieldType (apply s/enum all-element-types)}))


  (s/defschema Content [(s/either BasicElement
                                  WrapperElement)])

  (s/defschema Rule {:type s/Str
                     :triggerId s/Str
                     :targetIds [s/Str]
                     (s/optional-key :params) s/Any})

  (s/defschema Rules [Rule])

  (s/defschema Form {:id Long,
                     :content Content,
                     :rules Rules,
                     :created_at s/Inst})

  (s/defschema Answers
    "Answers consists of a key (String) value pairs, where value may be String or an array of more answers"
    { :value [Answer] })

  (s/defschema Submission {:id Long
                           :created_at s/Inst
                           :form Long
                           :version Long
                           :version_closed (s/maybe s/Inst)
                           :answers Answers})

  (s/defschema SubmissionValidationError
    {:error s/Str})

  (s/defschema SubmissionValidationErrors
    "Submission validation errors contain a mapping from field id to list of validation errors"
    {s/Keyword [SubmissionValidationError]}))