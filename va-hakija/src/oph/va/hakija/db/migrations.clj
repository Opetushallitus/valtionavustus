(ns oph.va.hakija.db.migrations
  (:require [oph.common.db.migrations :as migrations]
            [oph.form.db :as db]
            [oph.form.formutil :as formutil])
  (:gen-class))

(defn migrate [ds-key & migration-paths]
  (apply (partial migrations/migrate ds-key) migration-paths))

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
