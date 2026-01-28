(ns oph.va.hakija.notification-formatter
  (:require [oph.common.datetime :as datetime]
            [oph.common.email :refer [legacy-email-field-ids]]
            [oph.va.hakija.jotpa :refer [is-jotpa-avustushaku]]
            [oph.soresu.form.formutil :refer :all]))

(defn is-notification-email-field [field]
  (or
   (some #(= (:key field) %) legacy-email-field-ids)
   (has-attribute? :fieldType "vaEmailNotification" field)))

(defn- find-emails-to-notify [answers]
  (->> (flatten-answers answers [])
       (filter is-notification-email-field)
       (map :value)
       (filterv (comp not empty?))))

(defn send-submit-notifications! [send! is-change-request-response? answers submitted-hakemus avustushaku hakemus-id]
  (let [haku-id                (:id avustushaku)
        avustushaku-content    (:content avustushaku)
        language               (keyword (:language submitted-hakemus))
        avustushaku-title      (-> avustushaku-content :name language)
        avustushaku-duration   (->> avustushaku-content
                                    :duration)
        avustushaku-start-date (->> avustushaku-duration
                                    :start
                                    (datetime/parse))
        avustushaku-end-date   (->> avustushaku-duration
                                    :end
                                    (datetime/parse))
        destination-emails     (find-emails-to-notify answers)
        user-key               (-> submitted-hakemus :user_key)
        business-id            (:business_id submitted-hakemus)
        is-jotpa-avustushaku?  (is-jotpa-avustushaku avustushaku)]
    (when (not-empty destination-emails)
      (send! is-change-request-response?
             is-jotpa-avustushaku?
             language
             destination-emails
             haku-id
             avustushaku-title
             user-key
             avustushaku-start-date
             avustushaku-end-date
             hakemus-id
             business-id))))
