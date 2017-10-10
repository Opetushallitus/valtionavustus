(ns oph.soresu.form.schema
  (:require [schema.core :as s]
            [schema.spec.leaf :as s-leaf]
            [schema.spec.core :as s-spec]
            [oph.soresu.common.types :as types]
            [oph.soresu.common.validation :as validation]))

(defn field-class-type-of? [field-class n]
  (and (map? n) (= (:fieldClass n) field-class)))

(defn error-type? [n]
  (and (map? n) (contains? n :error)))

(def Email
  (s/pred validation/email-address? "Email"))

(def FinnishBusinessId
  (s/pred validation/finnish-business-id? "FinnishBusinessId"))

(defn create-form-schema [custom-wrapper-element-types custom-form-element-types custom-info-element-types]
  (s/defschema LocalizedString {:fi s/Str
                                :sv s/Str})

  (s/defschema Option {:value s/Str
                       (s/optional-key :label) LocalizedString})

  (s/defschema Button {:fieldClass (s/eq "button")
                       :id s/Str
                       (s/optional-key :label) LocalizedString
                       (s/optional-key :params) s/Any
                       :fieldType s/Keyword})

  (let [default-form-element-types ["textField"
                                    "textArea"
                                    "nameField"
                                    "emailField"
                                    "moneyField"
                                    "finnishBusinessIdField"
                                    "iban"
                                    "bic"
                                    "dropdown"
                                    "radioButton"
                                    "checkboxButton"
                                    "namedAttachment"
                                    "koodistoField"
                                    "tableField"]
        form-element-types (into custom-form-element-types default-form-element-types)
        default-wrapper-element-types ["theme" "fieldset" "growingFieldset" "growingFieldsetChild" ]
        wrapper-element-types (into custom-wrapper-element-types default-wrapper-element-types)
        all-answer-element-types (into form-element-types wrapper-element-types)
        default-info-element-types ["h1"
                                    "h3"
                                    "link"
                                    "p"
                                    "bulletList"
                                    "dateRange"
                                    "endOfDateRange"]
        info-element-types (into custom-info-element-types default-info-element-types)]
    (s/defschema FormField {:fieldClass (s/eq "formField")
                            :id s/Str
                            :required s/Bool
                            (s/optional-key :label) LocalizedString
                            :helpText LocalizedString
                            (s/optional-key :initialValue) (s/conditional integer? s/Int
                                                                          :else LocalizedString)
                            (s/optional-key :params) s/Any
                            (s/optional-key :options) [Option]
                            :fieldType (apply s/enum form-element-types)})

    (s/defschema InfoElement {:fieldClass (s/eq "infoElement")
                              :id s/Str
                              :fieldType (apply s/enum info-element-types)
                              (s/optional-key :params) s/Any
                              (s/optional-key :label) LocalizedString
                              (s/optional-key :text) LocalizedString})

    (s/defschema BasicElement (s/conditional (partial field-class-type-of? "formField") FormField
                                             (partial field-class-type-of? "button") Button
                                             (partial field-class-type-of? "infoElement") InfoElement))

    (s/defschema WrapperElement {:fieldClass                (s/eq "wrapperElement")
                                 :id                        s/Str
                                 :fieldType                 (apply s/enum wrapper-element-types )
                                 :children                  [(s/if (partial field-class-type-of? "wrapperElement")
                                                               (s/recursive #'WrapperElement)
                                                               BasicElement)]
                                 (s/optional-key :params)   s/Any
                                 (s/optional-key :label)    LocalizedString
                                 (s/optional-key :helpText) LocalizedString})

    (s/defschema Answer {:key s/Str,
                         :value (s/conditional integer? s/Int
                                               string? s/Str
                                               (partial types/sequential-of? String) [s/Str]
                                               (partial types/sequential-2d-of? String) [[s/Str]]
                                               :else [(s/recursive #'Answer)])
                         :fieldType (apply s/enum all-answer-element-types)}))

  (s/defschema Content [(s/if (partial field-class-type-of? "wrapperElement")
                          WrapperElement
                          BasicElement)])

  (s/defschema Rule {:type s/Str
                     :triggerId s/Str
                     :targetIds [s/Str]
                     (s/optional-key :params) s/Any})

  (s/defschema Rules [Rule])

  (s/defschema Form {:content Content
                     :rules Rules
                     :created_at s/Inst
                     :updated_at s/Inst})

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
    {:error s/Str
     (s/optional-key :info) s/Any})

  (s/defschema SubmissionValidationErrors
    "Submission validation errors contain a mapping from field id to list of validation errors"
    {s/Keyword [SubmissionValidationError]}))
