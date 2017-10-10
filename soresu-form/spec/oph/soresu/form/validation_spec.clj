(ns oph.soresu.form.validation-spec
  (:require [speclj.core :refer :all]
            [oph.soresu.form.validation :refer :all]))

(defn- timestamp-now []
  (let [millis-now (.getTime (java.util.Date.))]
    (java.sql.Timestamp. millis-now)))

(defn- answers-for [field value]
  (let [field-id (:id field)
        field-type (:fieldType field)]
    {:value [{:key field-id
              :value value
              :fieldType field-type}]}))

(defn- attachments-for [field filename]
  (let [field-id (:id field)]
    {field-id {:id              2
               :hakemus-id      "2c679cedcb5f62b101dd3a49d053bd7f8ef3e71a538e6c15dff054d9ccab5c1c"
               :version         0
               :field-id        (:id field)
               :file-size       3
               :content-type    "text/plain"
               :hakemus-version 5
               :created-at      (timestamp-now)
               :filename        filename}}))

(def empty-answers
  {:value []})

(def email-field
  {:id         "email"
   :fieldClass "formField"
   :fieldType  "emailField"
   :required   true})

(def finnish-business-id-field
  {:id         "y-tunnus"
   :fieldClass "formField"
   :fieldType  "finnishBusinessIdField"
   :required   true})

(def attachment-field
  {:id         "income-statement"
   :fieldClass "formField"
   :fieldType  "namedAttachment"
   :required   true})

(def table-field-fixed-rows
  {:id         "art-courses"
   :fieldClass "formField"
   :fieldType  "tableField"
   :required   true
   :params     {:columns [{:title        {:fi "Oppilaitos"
                                          :sv "TODO: Oppilaitos"}
                           :valueType    "string"
                           :maxlength    30}
                          {:title        {:fi "Opiskelijoita"
                                          :sv "TODO: Opiskelijoita"}
                           :valueType    "integer"
                           :maxlength    6
                           :calculateSum true}
                          {:title        {:fi "Tuntimäärä"
                                          :sv "TODO: Tuntimäärä"}
                           :valueType    "decimal"
                           :maxlength    4
                           :calculateSum true}]
                :rows     [{:title       {:fi "Perspektiivi 101"
                                          :sv "SV: Perspektiivi 101"}}
                           {:title       {:fi "Vesivärit"
                                          :sv "SV: Vesivärit"}}
                           {:title       {:fi "Liidut"
                                          :sv "SV: Liidut"}}]}})

(def table-field-free-rows
  {:id         "favorite-colors"
   :fieldClass "formField"
   :fieldType  "tableField"
   :required   true
   :params     {:columns [{:title    {:fi "Väri"
                                      :sv "TODO: Väri"}
                           :valueType "string"}]}})

(describe "validation"
  (tags :validation)

  (it "validates optional empty field as valid"
      (let [field  (assoc email-field :required false)
            result (validate-field (answers-for field "") [] field)]
        (should= {:email []} result)))

  (it "validates non-empty email"
      (should= {:email []} (validate-field (answers-for email-field "testi@test.org") [] email-field))
      (should= {:email [{:error "email"}]} (validate-field (answers-for email-field "invalid") [] email-field)))

  (it "validates empty email as required"
      (let [result (validate-field (answers-for email-field "") [] email-field)]
        (should= {:email [{:error "required"}]} result)))

  (it "validates non-empty finnish business"
      (should= {:y-tunnus []} (validate-field (answers-for finnish-business-id-field "1629284-5") [] finnish-business-id-field))
      (should= {:y-tunnus [{:error "finnishBusinessId"}]} (validate-field (answers-for finnish-business-id-field "1629284-6") [] finnish-business-id-field)))

  (it "validates empty finnish-business-id-field as required"
      (let [result (validate-field (answers-for finnish-business-id-field nil) [] finnish-business-id-field)]
        (should= {:y-tunnus [{:error "required"}]} result)))

  (it "validates attachment"
      (let [result (validate-field empty-answers (attachments-for attachment-field "file.txt") attachment-field)]
        (should= {:income-statement []} result)))

  (it "validates missing attachment as required"
      (let [result (validate-field empty-answers [] attachment-field)]
        (should= {:income-statement [{:error "required"}]} result)))

  (it "validates table with fixed rows"
      (let [value  [["Lukio", "30", "31,5"]
                    ["Peruskoulu", "40", "41"]
                    ["Lastentarha", "50", "51,0"]]
            result (validate-field (answers-for table-field-fixed-rows value) [] table-field-fixed-rows)]
        (should= {:art-courses []} result)))

  (it "validates table with free rows"
      (let [value  [["Keltainen"], ["Vihreä"], ["Ruskea"]]
            result (validate-field (answers-for table-field-free-rows value) [] table-field-free-rows)]
        (should= {:favorite-colors []} result)))

  (it "validates empty table as required"
      (let [result (validate-field (answers-for table-field-fixed-rows "") [] table-field-fixed-rows)]
        (should= {:art-courses [{:error "required"}]} result)))

  (it "validates empty optional table with fixed rows as valid"
      (let [field  (assoc table-field-fixed-rows :required false)
            result (validate-field (answers-for field nil) [] field)]
        (should= {:art-courses []} result)))

  (it "validates empty optional table with free rows as valid"
      (let [field  (assoc table-field-free-rows :required false)
            result (validate-field (answers-for field nil) [] field)]
        (should= {:favorite-colors []} result)))

  (it "validates table with string value as invalid"
      (let [result (validate-field (answers-for table-field-fixed-rows "abc") [] table-field-fixed-rows)]
        (should= {:art-courses [{:error "table-is-not-two-dimensional"}]} result)))

  (it "validates table with one-dimensional collection as invalid"
      (let [result (validate-field (answers-for table-field-fixed-rows ["a" "b" "c"]) [] table-field-fixed-rows)]
        (should= {:art-courses [{:error "table-is-not-two-dimensional"}]} result)))

  (it "validates table with three-dimensional collection as invalid"
      (let [result (validate-field (answers-for table-field-free-rows [[["Vihreä"]]]) [] table-field-free-rows)]
        (should= {:favorite-colors [{:error "table-is-not-two-dimensional"}]} result)))

  (it "validates table with fixed rows and too few rows as invalid"
      (let [value  [["Lukio", "30", "31"]
                    ["Lastentarha", "50", "51"]]
            result (validate-field (answers-for table-field-fixed-rows value) [] table-field-fixed-rows)]
        (should= {:art-courses [{:error "table-has-unexpected-number-of-rows"}]} result)))

  (it "validates table with fixed rows and too many rows as invalid"
      (let [value  [["Lukio", "30", "31"]
                    ["Peruskoulu", "40", "41"]
                    ["Lastentarha", "50", "51"]
                    ["Aikuisoppilaitois", "60", "61"]]
            result (validate-field (answers-for table-field-fixed-rows value) [] table-field-fixed-rows)]
        (should= {:art-courses [{:error "table-has-unexpected-number-of-rows"}]} result)))

  (it "validates optional table with fixed rows and empty rows as invalid"
      (let [field  (assoc table-field-fixed-rows :required false)
            result (validate-field (answers-for field []) [] field)]
        (should= {:art-courses [{:error "table-has-unexpected-number-of-rows"}]} result)))

  (it "validates optional table with free rows and empty rows as valid"
      (let [field  (assoc table-field-free-rows :required false)
            result (validate-field (answers-for field []) [] field)]
        (should= {:favorite-colors []} result)))

  (it "validates table with too long value as invalid"
      (let [value  [["Lukio", "30", "31000"]
                    ["Peruskoulu", "40", "41"]
                    ["Lastentarha", "50", "51"]]
            result (validate-field (answers-for table-field-fixed-rows value) [] table-field-fixed-rows)]
        (should= {:art-courses [{:error "table-has-cell-exceeding-max-length"}]} result)))

  (it "validates table with empty values as invalid"
      (let [value  [["Lukio", "30", "31"]
                    ["Peruskoulu", "", "41"]
                    ["", "50", "51"]]
            result (validate-field (answers-for table-field-fixed-rows value) [] table-field-fixed-rows)]
        (should= {:art-courses [{:error "table-has-cell-with-invalid-value"}]} result)))

  (it "validates table with invalid integer values as invalid"
      (let [value  [["Lukio", "30", "31"]
                    ["Peruskoulu", "20,5", "41"]
                    ["Lastentarha", "50", "51"]]
            result (validate-field (answers-for table-field-fixed-rows value) [] table-field-fixed-rows)]
        (should= {:art-courses [{:error "table-has-cell-with-invalid-value"}]} result)))

    (it "validates table with invalid decimal values as invalid"
      (let [value  [["Lukio", "30", "31,a"]
                    ["Peruskoulu", "20", "41"]
                    ["Lastentarha", "50", "-"]]
            result (validate-field (answers-for table-field-fixed-rows value) [] table-field-fixed-rows)]
        (should= {:art-courses [{:error "table-has-cell-with-invalid-value"}]} result))))

(run-specs)
