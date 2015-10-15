(ns oph.va.hakija.submit-notification
  (:use [clojure.tools.trace :only [trace]])
   (:require [oph.common.datetime :as datetime]
             [oph.form.formutil :refer :all]
             [oph.va.hakija.email :as va-email]))

(defn send-submit-notifications! [answers submitted-hakemus avustushaku]
  (let [haku-id (:id avustushaku)
        avustushaku-content (:content avustushaku)
        language (keyword (find-answer-value answers "language"))
        avustushaku-title (-> avustushaku-content :name language)
        avustushaku-duration (->> avustushaku-content
                                  :duration)
        avustushaku-start-date (->> avustushaku-duration
                                    :start
                                    (datetime/parse))
        avustushaku-end-date (->> avustushaku-duration
                                  :end
                                  (datetime/parse))
        organization-email (find-answer-value answers "organization-email")
        primary-email (find-answer-value answers "primary-email")
        signature-email (find-answer-value answers "signature-email")
        user-key (-> submitted-hakemus :user_key)]
    (va-email/send-hakemus-submitted-message! language
                                              [primary-email organization-email signature-email]
                                              haku-id
                                              avustushaku-title
                                              user-key
                                              avustushaku-start-date
                                              avustushaku-end-date)))
