(ns oph.va.hakija.db.migrations
  (:require [oph.soresu.common.db.migrations :as migrations]
            [oph.soresu.common.db :as common-db]
            [oph.soresu.form.db :as db]
            [oph.va.hakija.db :as va-db]
            [oph.soresu.form.formutil :as formutil]
            [clojure.set :as set]
            [clojure.tools.trace :refer [trace]]
            [yesql.core :refer [defquery]])
  (:gen-class))

(defn migrate [& migration-paths]
  (migrations/migrate "hakija" migration-paths))

(defn update-forms! [forms-to-transform transformation]
  (doseq [form forms-to-transform]
    (let [changed-form (formutil/transform-form-content form transformation)]
      (common-db/with-tx (fn [tx] (db/update-form! tx changed-form))))))

(migrations/defmigration migrate-organization-email-of-form1 "1.10"
  "Change organization email description of form 1"
  (let [form (db/get-form 1)
        new-organization-email-field {:id "organization-email"
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
    (common-db/with-tx (fn [tx] (db/update-form! tx changed-form)))))

(defquery update-avustushaku-content! "db/migration/queries/m1_15-update-avustushaku-content.sql")

(migrations/defmigration migrate-add-painopistealueet-for-avustushaut "1.15"
  "Add empty painopistealueet to all avustushaut"
  (let [painopiste-alueet {:items []
                           :label {:fi "Painopistealueet"
                                   :sv "Fokusområden"}}]
    (doseq [avustushaku (va-db/list-avustushaut)]
      (let [new-content (assoc (:content avustushaku) :focus-areas painopiste-alueet)
            changed-avustushaku (assoc avustushaku :content new-content)]
        (common-db/exec update-avustushaku-content! changed-avustushaku)))))

(migrations/defmigration migrate-field-type-and-fieldType-terms "1.16"
  "Change type to fieldClass and displayAs to fieldType"
  (letfn [(rename-attributes [node]
            (if (:displayAs node)
              (clojure.set/rename-keys node {:type :fieldClass, :displayAs :fieldType})
              node))]
    (doseq [form (db/list-forms)]
      (let [changed-form (formutil/transform-form-content form rename-attributes)]
        (common-db/with-tx (fn [tx] (db/update-form! tx changed-form)))))))

(defquery list-all-submission-versions "db/migration/queries/m1_18-list-all-submission-versions.sql")
(defquery update-submission-directly! "db/migration/queries/m1_18-update-submission-directly.sql")

(migrations/defmigration migrate-add-fieldtype-to-submissions "1.18"
  "Add fieldType to each form_submissions value"
  (let [all-submission-versions (common-db/exec list-all-submission-versions {})
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
          (common-db/exec update-submission-directly! {:answers (updated-submission :answers)
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

(migrations/defmigration migrate-remove-helptext-from-info-and-wrapper-elements "1.22"
  "Remove helpText from info and wrapper elements"
  (letfn [(has-empty-helptext? [node]
            (and (:helpText node)
                 (= "" (:fi (:helpText node)))))
          (remove-helptext [node]
            (if (or (formutil/is-info-element? node)
                    (and (formutil/is-wrapper-element? node) (has-empty-helptext? node)))
              (dissoc node :helpText)
              node))]
    (update-forms! (db/list-forms) remove-helptext)))

(defquery update-avustushaku-decision! "db/migration/queries/m1_42-update-avustushaku-decision.sql")

(migrations/defmigration migrate-rename-avustushaku-decision-json-key-from-esittelija-to-valmistelija "1.42"
  "Rename avustushaku decision json key from \"esittelija\" to \"valmistelija\""
  (doseq [avustushaku (va-db/list-avustushaut)]
    (let [new-decision (set/rename-keys (:decision avustushaku) {:esittelija :valmistelija})
          changed-avustushaku (assoc avustushaku :decision new-decision)]
      (common-db/exec update-avustushaku-decision! changed-avustushaku))))

(defquery get-hakemukset-with-selvitys-email "db/migration/queries/m1_46-get-hakemukset-with-selvitys-email.sql")
(defquery update-hakemus-selvitys-email-by-id! "db/migration/queries/m1_46-update-hakemus-selvitys-email-by-id.sql")

(migrations/defmigration migrate-change-to-field-inside-selvitys-email-to-array "1.46"
  "Change `to` field inside `selvitys_email` jsonb field to be an array of emails"
  (letfn [(convert-selvitys-email [email]
            (let [org-to (:to email)
                  new-to (cond
                           (sequential? org-to) org-to
                           (some? org-to) [org-to]
                           :else [])]
              (assoc email :to new-to)))]
    (doseq [hakemus (common-db/exec get-hakemukset-with-selvitys-email {})]
      (common-db/exec
       update-hakemus-selvitys-email-by-id!
       {:id             (:id hakemus)
        :selvitys_email (convert-selvitys-email (:selvitys_email hakemus))}))))
(defn assoc-in-if [m ks value]
  (if (nil? (get-in m ks))
    (assoc-in m ks value)
    m))

(defn set-missing-content-values [grant]
  (-> grant
      (assoc-in-if [:content :operational-unit] "")
      (assoc-in-if [:content :project] "")
      (assoc-in-if [:content :operation] "")))

(migrations/defmigration migrate-add-default-values-for-payment-fields "1.47"
  "Add default values for payment fields `operational-unit`, `project`,
  `operation`. Default value will be empty string."
  (doseq [avustushaku (va-db/list-avustushaut)]
    (common-db/exec
     update-avustushaku-content!
     (set-missing-content-values avustushaku))))

(migrations/defmigration migrate-add-empty-versions-to-avustushaku-decision-attachments "1.50"
  "Add empty versions to decision attachments in avustushaut"
  (doseq [avustushaku (va-db/list-avustushaut)]
    (let [decision (:decision avustushaku)]
      (when-some [decision-liitteet (:liitteet decision)]
        (let [new-liitteet (map (fn [l] (assoc l :version "")) decision-liitteet)
              new-decision (assoc decision :liitteet new-liitteet)]
          (common-db/exec update-avustushaku-decision!
                          {:id       (:id avustushaku)
                           :decision new-decision}))))))
