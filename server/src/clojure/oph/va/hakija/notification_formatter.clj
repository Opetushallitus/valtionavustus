(ns oph.va.hakija.notification-formatter
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
   (:require [oph.common.datetime :as datetime]
             [oph.common.email :refer [legacy-email-field-ids]]
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
        user-key               (-> submitted-hakemus :user_key)]
    (when (not-empty destination-emails)
      (send! is-change-request-response?
             language
             destination-emails
             haku-id
             avustushaku-title
             user-key
             avustushaku-start-date
             avustushaku-end-date
             hakemus-id
             ))))
