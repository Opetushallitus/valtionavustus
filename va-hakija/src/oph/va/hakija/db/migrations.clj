(ns oph.va.hakija.db.migrations
  (:require [oph.common.db.migrations :as migrations]
            [oph.common.db :as common-db]
            [oph.form.db :as db]
            [oph.va.hakija.db :as va-db]
            [oph.form.formutil :as formutil]
            [clojure.tools.trace :refer [trace]]
            [yesql.core :refer [defquery]])
  (:gen-class))

(defn migrate [ds-key & migration-paths]
  (apply (partial migrations/migrate ds-key) migration-paths))

(defn update-forms! [forms-to-transform transformation]
  (doseq [form forms-to-transform]
      (let [changed-form (formutil/transform-form-content form transformation)]
        (db/update-form! changed-form))))

(migrations/defmigration migrate-organization-email-of-form1 "1.10"
  "Change organization email description of form 1"
  (let [form (db/get-form 1)
        new-organization-email-field {
          :id "organization-email"
          :type "formField"
          :required true
          :displayAs "emailField"
          :label {:fi "Kirjaamon sähköposti" :sv "Registraturens e-postadress"}
          :params {:size "small" :maxlength 80}
          :helpText {:fi "Ilmoita hakijaorganisaation virallinen sähköpostiosoite, johon voidaan lähettää päätöksentekoon liittyviä asiakirjoja.", :sv "Meddela den sökande organisationens officiella e-postadress där dokument som rör beslutfattandet kan sändas."}}
        changed-form (formutil/transform-form-content form
                                                      (fn [node]
                                                        (if (= (:id node) "organization-email")
                                                          new-organization-email-field
                                                          node)))]
    (db/update-form! changed-form)))

(migrations/defmigration migrate-add-painopistealueet-for-avustushaut "1.15"
  "Add empty painopistealueet to all avustushaut"
 (let [painopiste-alueet {:items []
                          :label {
                            :fi "Painopistealueet"
                            :sv "Fokusområden"}}]
    (doseq [avustushaku (va-db/list-avustushaut)]
      (let [new-content (assoc (:content avustushaku) :focus-areas painopiste-alueet)
            changed-avustushaku (assoc avustushaku :content new-content)]
        (va-db/update-avustushaku changed-avustushaku)))))

(migrations/defmigration migrate-field-type-and-fieldType-terms "1.16"
  "Change type to fieldClass and displayAs to fieldType"
 (letfn [(rename-attributes [node]
           (if (:displayAs node)
             (clojure.set/rename-keys node {:type :fieldClass, :displayAs :fieldType})
             node))]
  (doseq [form (db/list-forms)]
    (let [changed-form (formutil/transform-form-content form rename-attributes)]
      (db/update-form! changed-form)))))

(defquery list-all-submission-versions "db/migration/queries/m1_18-list-all-submission-versions.sql")
(defquery update-submission-directly! "db/migration/queries/m1_18-update-submission-directly.sql")

(migrations/defmigration migrate-add-fieldtype-to-submissions "1.18"
  "Add fieldType to each form_submissions value"
 (let [all-submission-versions (common-db/exec :db list-all-submission-versions {})
       all-forms (db/list-forms)
       id-regexp-type-map {#"language" "radioButton"
                           #"project-description" "growingFieldset"
                           #"project-description-\d+" "vaProjectDescription"
                           #"project-description-\d+.(goal|activity|result)" "textField"
                           #"project-description.project-description-\d+.(goal|activity|result)" "textField"
                           #"signatories-fieldset" "growingFieldset"
                           #"signatories-fieldset-\d+" "growingFieldsetChild"
                           #"signatories-fieldset-\d.name+" "textField"
                           #"signatories-fieldset-\d.email+" "vaEmailNotification"
                           #"other-organizations" "growingFieldset"
                           #"other-organizations-\d+" "growingFieldsetChild"
                           #"other-organizations.other-organizations-\d+.name" "textField"
                           #"other-organizations.other-organizations-\d+.email" "emailField"}]
   (letfn [(find-type-from-form [id form-fields]
              (->> (filter #(= (:id %) id) form-fields) first :fieldType))
           (find-type-by-id-string [id]
              (->> id-regexp-type-map
                   keys
                   (map (fn [r] {:match (re-matches r id)
                                 :fieldType (get id-regexp-type-map r)}))
                   (filter :match)
                   (map :fieldType)
                   first))
           (resolve-field-type [id form-fields]
                         (if-let [type-from-form (find-type-from-form id form-fields)]
                           type-from-form
                           (find-type-by-id-string id)))
           (resolve-field-type-with-assert [id form-fields]
              (let [found-type (resolve-field-type id form-fields)]
                (assert found-type (str "No field type found for " id))
                found-type))
           (add-field-type [my-form-content node]
             (if (:key node)
               (merge node {:fieldType (resolve-field-type-with-assert (:key node) my-form-content)})
               node))]
        (doseq [submission all-submission-versions]
          (let [my-form-content (->> all-forms (filter #(= (:id %) (:form submission))) first :content formutil/find-fields)
                updated-submission (formutil/transform-tree submission :answers (partial add-field-type my-form-content))]
            (common-db/exec :db update-submission-directly! {:answers (updated-submission :answers)
                                                             :submission_id (:id submission)
                                                             :version (:version submission)
                                                             :form_id (:form submission)}))))))

(migrations/defmigration migrate-add-helptext-to-all-form-fields "1.20"
  "Add empty helpText to all form fields that currently don't have helpText"
 (letfn [(missing-helptext? [node]
           (and (:fieldClass node)
                (not (:helpText node))))
         (add-helptext [node]
           (if (missing-helptext? node)
             (assoc node :helpText {:fi "" :sv ""})
             node))]
   (update-forms! (db/list-forms) add-helptext)))