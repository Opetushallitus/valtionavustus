(ns oph.va.hakija.cmd.populate
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.hakija.db :refer :all]
            [oph.soresu.form.validation :as validation]
            [oph.soresu.form.db :refer :all]
            [oph.soresu.form.formutil :as form-util])
  (:import [java.io File]))

(def valid-answers
  {:value [{:key "organization" :value "Testi Organisaatio" :fieldType "textField"}
           {:key "organization-email" :value "org@example.com" :fieldType "emailField"}
           {:key "business-id" :value "5278603-3" :fieldType "finnishBusinessIdField"}
           {:key "applicant-name" :value "Teemu Hakija" :fieldType "textField"}
           {:key "primary-email" :value "test@example.com" :fieldType "emailField"}
           {:key "signature" :value "Teemu Testaaja, CEO" :fieldType "textField"}
           {:key "signature-email" :value "teemu@example.com" :fieldType "emailField"}
           {:key "language" :value "fi" :fieldType "radioButton"}
           {:key "project-name" :value "Server-spec-hanke" :fieldType "textField"}
           {:key "combined-effort" :value "no" :fieldType "radioButton"}
           {:key "other-organizations"
            :value [{:key "other-organizations-1"
                     :value [{:key "other-organizations.other-organizations-1.name"
                              :value "E.T. Extra Terrestrial"
                              :fieldType "textField"}
                             {:key "other-organizations.other-organizations-1.email"
                              :value "et@example.com"
                              :fieldType "emailField"}]
                     :fieldType "growingFieldsetChild"}]
            :fieldType "growingFieldset"}
           {:key "project-goals" :value "Maaleja" :fieldType "textField"}
           {:key "project-description.project-description-1.goal"
            :value "Paremmat oppimistulokset"
            :fieldType "textField"}
           {:key "project-description.project-description-1.activity"
            :value "Pidämme työpajoja"
            :fieldType "textField"}
           {:key "project-description.project-description-1.result"
            :value "Jotkut lähtevät jatko-opiskelemaan"
            :fieldType "textField"}
           {:key "bank-bic" :value "5000" :fieldType "bic"}
           {:key "bank-iban" :value "FI 32 5000 4699350600" :fieldType "iban"}
           {:key "project-target" :value "Maali" :fieldType "textField"}
           {:key "project-measure" :value "Mittaus" :fieldType "textField"}
           {:key "project-announce" :value "Julkaisut" :fieldType "textField"}
           {:key "project-effectiveness" :value "Tehokkuus" :fieldType "textField"}
           {:key "project-spreading-plan" :value "Jakelusuunnitelma" :fieldType "textField"}
           {:key "coordination-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "personnel-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "service-purchase-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "material-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "rent-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "equipment-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "steamship-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "other-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "project-incomes-row.amount" :value "10" :fieldType "moneyField"}
           {:key "eu-programs-income-row.amount" :value "10" :fieldType "moneyField"}
           {:key "other-public-financing-income-row.amount" :value "10" :fieldType "moneyField"}
           {:key "private-financing-income-row.amount" :value "10" :fieldType "moneyField"}]})


(def person-names {:start ["Jorma" "Pertti" "Esko" "Anna" "Marjo" "Tiina"]
                   "Jorma" ["Karhu." "Vasara." "Männikäinen."]
                   "Pertti" ["Jorma" "Arinen." "Haahka."]
                   "Esko" ["Pertti" "Tiittanen." "Hollokainen."]
                   "Anna" ["Esko" "Helko." "Hyyppä."]
                   "Marjo" ["Tiina" "Dufva." "Haapasalmi." "Haapoja."]
                   "Tiina" ["Anna" "Vasara." "Kirves." "Ankkuri."]})

(def project-names {:start ["Virtaa" "Voimaa" "Räjähtävää" "Tuulta" "Rauhaa"]
                    "Virtaa" ["Tanssimalla" "Vasaroimalla." "Hirven"]
                    "Voimaa" ["Punttisalilta." "Tanssimalla" "Mäntymetsästä."]
                    "Tanssimalla" ["Hirven" "Taulun" "Colapullon"]
                    "Hirven" ["Kanssa." "Mukana." "Tahtiin."]
                    "Räjähtävää" ["Voimaa" "Tuulta" "Virtaa"]
                    "Taulun" ["Äärellä." "Maalauksesta."]
                    "Rauhaa" ["Taulun" "Tuulta"]
                    "Tuulta" ["Purjeisiin." "Tanssimalla" "Hirven"]
                    "Colapullon" ["Äärellä." "Pyörittämisellä." "Uusiokäytöstä."]})

(def organization-names {:start ["Lohjan" "Valtimon" "Rovaniemen" "Helsingin" "Rauman" "Tampereen"
                                 "Espoon" "Vantaan" "Pudasjärven" "Riihimäen" "Turun" "Raision"]
                         "Lohjan" ["Settlementti" "Koulutus"]
                         "Rovaniemen" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Rauman" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Tampereen" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Espoon" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Vantaan" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Pudasjärven" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Riihimäen" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Turun" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Raision" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Valtimon" ["Settlementti" "Akatemia."]
                         "Settlementti" ["Yhdistys." "Oy."]
                         "Helsingin" ["Valtimon" "Koulutus"]
                         "Koulutus" ["Oy." "Järjestö." "Ja"]
                         "Ja" ["Konferenssi." "Akatemia." "Rovaniemen" "Lohjan"]})

(def random-text {:start ["Liiba" "Laaba"]
                  "Liiba" ["Bup." "Laaba"]
                  "Laaba" ["Dib." "Dibbiti" "Bobbiti"]
                  "Dibbiti" ["Dobbiti" "Bobbiti"]
                  "Dobbiti" ["Duh." "Bobbiti"]
                  "Bobbiti" ["Liiba" "Bup."]})

;; See: https://diegobasch.com/fun-with-markov-chains-and-clojure
(defn sentence [data]
  (loop [ws (data :start)
         acc []]
    (let [w (rand-nth ws)
          nws (data w)
          nacc (concat acc [w])]
      (if (= \. (last w))
        (clojure.string/join " " nacc)
        (recur nws nacc)))))

(defn generate-text [data field]
  (let [text (-> (sentence data)
                 (clojure.string/replace  #"\." ""))
        max-length (-> field :params :maxlength)]
    (if max-length
      (subs text 0 (min (count text) max-length))
      text)))

(defmulti generate-text-field :id)
(defmethod generate-text-field "organization" [field] (generate-text organization-names field))
(defmethod generate-text-field "applicant-name" [field] (generate-text person-names field))
(defmethod generate-text-field "signature" [field] (generate-text person-names field))
(defmethod generate-text-field "project-name" [field] (generate-text project-names field))
(defmethod generate-text-field "applicant-name" [field] (generate-text person-names field))
(defmethod generate-text-field :default [field] (generate-text random-text field))

(defmulti generate :fieldType)

(defmethod generate "textField" [field] (generate-text-field field))

(defmethod generate "emailField" [field] "foobar@example.org")
(defmethod generate "vaEmailNotification" [field] "foobar@example.org")
(defmethod generate "radioButton" [field] (:value (first (:options field))))
(defmethod generate "vaFocusAreas" [field] [(:value (first (:options field)))])
(defmethod generate "checkboxButton" [field] [(:value (first (:options field)))])
(defmethod generate "textArea" [field] (generate-text random-text field))

(defmethod generate "moneyField" [field] (str (rand-int 120000)))

(defmethod generate "finnishBusinessIdField" [field] "5278603-3")
(defmethod generate "iban" [field] "FI21 1234 5600 0007 85")
(defmethod generate "bic" [field] "TESTBANK")


(defmethod generate :default [field]
  (trace "unknown fieldtype" field)
  (assert false))

(defn handle-attachment [hakemus-id hakemus-version field]
  (if (= (:fieldType field) "namedAttachment")
    (let [file (File. "test-data/test.png")]
      (create-attachment hakemus-id hakemus-version (:id field) "test.png" "image/png" (.length file) (.getAbsoluteFile file))
      false)
    true))

(defn update-form-submission [form-id values-id answers]
  (if (not (submission-exists? form-id values-id))
    (throw (Exception. "Submission not found"))
    (update-submission! form-id values-id answers)))

(defn generate-data [avustushaku amount]
  (let [avustushaku-id (:id avustushaku)
        form-id (:form avustushaku)
        attachments []
        form (get-form form-id)]
    (trace "Processing avustushaku" (-> avustushaku :content :name :fi))
    (doseq [x (range 0 amount)]
      (trace "Generating hakemus" x)
      (let [hakemus (->> (create-hakemus! avustushaku-id form-id {})
                         :hakemus)
            submission-id (:form_submission_id hakemus)
            answers (form-util/generate-answers form
                                                generate
                                                (partial handle-attachment (:id hakemus) (:version hakemus)))
            saved-submission (update-form-submission form-id submission-id answers)
            validation (validation/validate-form form answers (get-attachments (:user_key hakemus) (:id hakemus)))
            submission-version (:version saved-submission)]
        (when (not (every? empty? (vals validation)))
          (trace "Validation failed" validation)
          (trace "Answers" answers)
          (System/exit 1))
        (submit-hakemus avustushaku-id
                        (:user_key hakemus)
                        submission-id
                        submission-version
                        (:register_number hakemus)
                        answers)))))

(defn -main [& args]
  (let [avustushaut (->> (list-avustushaut)
                         (filter (fn [haku] (= (:status haku) "published"))))]
    (doseq [avustushaku avustushaut]
      (generate-data avustushaku (->> (first args)
                                    (Long/parseLong))))))
