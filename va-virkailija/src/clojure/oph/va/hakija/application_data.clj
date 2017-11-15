(ns oph.va.hakija.application-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :refer [convert-to-dash-keys]]
            [oph.va.hakija.grant-data :as grant-data])
  (:import (oph.va.jdbc.enums)))

(defn get-application [id]
  (convert-to-dash-keys
   (first
    (exec :form-db hakija-queries/get-application {:application_id id}))))

(defn get-application-with-evaluation-and-answers [id]
  (convert-to-dash-keys
   (first
    (exec :form-db hakija-queries/get-application-with-evaluation-and-answers
          {:application_id id}))))

(defn get-next-installment []
  "2000")

(defn create-payment [application-id]
  (let [application (get-application application-id)
        grant (grant-data/get-grant (:grant-id application))
        payment {:application_id application-id
                 :application_version (:version application)
                 :grant_id (:id grant)
                 :state 0
                 :installment (get-next-installment)
                 :document_type "XB"
                 :amount (:budget-granted application)
                 :long_ref ""
                 :transaction_account ""
                 :currency "EUR"
                 :lkp_account ""
                 :takp_account ""
                 :partner ""
                 :inspector_email ""
                 :acceptor_email ""}]
    (exec :form-db hakija-queries/create-payment payment)))
