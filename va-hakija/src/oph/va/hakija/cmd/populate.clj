(ns oph.va.hakija.cmd.populate
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.hakija.db :refer :all]
            [oph.soresu.form.db :refer :all]))

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

(defn update-form-submission [form-id values-id answers]
  (if (not (submission-exists? form-id values-id))
    (throw (Exception. "Submission not found"))
    (update-submission! form-id values-id answers)))

(defn -main [& args]
  (let [avustushaku-id 1
        form-id 1
        answers valid-answers]
    (doseq [x (range 1 (->> (first args)
                            (Long/parseLong)))]
      (let [hakemus (->> (create-hakemus! avustushaku-id form-id valid-answers)
                         :hakemus)
            submission-id (:form_submission_id hakemus)
            saved-submission (update-form-submission form-id submission-id answers)
            submission-version (:version saved-submission)]
        (submit-hakemus avustushaku-id
                        (:user_key hakemus)
                        submission-id
                        submission-version
                        (:register_number hakemus)
                        answers)))))
