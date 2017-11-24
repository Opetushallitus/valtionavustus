(ns oph.va.hakija.api.queries
  (:require [yesql.core :refer [defquery]]))

(defquery health-check "sql/hakija/healthcheck.sql")

(defquery create-avustushaku<! "sql/hakija/avustushaku/create.sql")
(defquery update-avustushaku! "sql/hakija/avustushaku/update.sql")
(defquery update-form-loppuselvitys! "sql/hakija/avustushaku/update-form-loppuselvitys.sql")
(defquery update-form-valiselvitys! "sql/hakija/avustushaku/update-form-valiselvitys.sql")
(defquery archive-avustushaku! "sql/hakija/avustushaku/archive.sql")
(defquery list-avustushaut-by-status "sql/hakija/avustushaku/list-by-status.sql")
(defquery list-avustushaut-not-deleted "sql/hakija/avustushaku/list-not-deleted.sql")
(defquery get-avustushaku "sql/hakija/avustushaku/get.sql")
(defquery get-avustushaku-payments "sql/hakija/avustushaku/get-payments.sql")
(defquery create-avustushaku-payment "sql/hakija/avustushaku/create-payment.sql")
(defquery get-payment-by-id "sql/hakija/avustushaku/get-payment-by-id.sql")
(defquery get-avustushaku-by-status "sql/hakija/avustushaku/get-by-status.sql")
(defquery create-avustushaku-role<! "sql/hakija/avustushaku/create-role.sql")
(defquery get-avustushaku-role "sql/hakija/avustushaku/get-role.sql")
(defquery update-avustushaku-role! "sql/hakija/avustushaku/update-role.sql")
(defquery delete-avustushaku-role! "sql/hakija/avustushaku/delete-role.sql")
(defquery get-avustushaku-roles "sql/hakija/avustushaku/get-roles.sql")
(defquery list-matching-avustushaut-by-ids "sql/hakija/avustushaku/list-matching-by-ids.sql")

(defquery get-grants "sql/hakija/grants/get-grants.sql")
(defquery get-grants-with-content
  "sql/hakija/grants/get-grants-with-content.sql")
(defquery get-grant "sql/hakija/grants/get-grant.sql")
(defquery get-grant-applications "sql/hakija/grants/get-grant-applications.sql")
(defquery get-grant-applications-with-evaluation
  "sql/hakija/grants/get-grant-applications-with-evaluation.sql")

(defquery get-application "sql/hakija/applications/get-application.sql")
(defquery get-application-with-evaluation-and-answers
  "sql/hakija/applications/get-application-with-evaluation-and-answers.sql")

(defquery get-application-payments
  "sql/hakija/applications/get-application-payments.sql")
(defquery create-payment "sql/hakija/applications/create-payment.sql")

(defquery list-hakemukset-by-avustushaku "sql/hakija/hakemus/list-by-avustushaku.sql")
(defquery get-by-type-and-parent-id "sql/hakija/hakemus/get-by-type-and-parent-id.sql")
(defquery list-hakemus-paatos-email-statuses "sql/hakija/hakemus/list-hakemus-paatokset-by-avustushaku.sql")
(defquery list-valiselvitys-hakemus-ids "sql/hakija/hakemus/list-valiselvitys-hakemus-ids.sql")
(defquery list-loppuselvitys-hakemus-ids "sql/hakija/hakemus/list-loppuselvitys-hakemus-ids.sql")
(defquery update-hakemus-selvitys-email! "sql/hakija/hakemus/update-hakemus-selvitys-email.sql")

(defquery copy-form<! "sql/hakija/form/copy.sql")
(defquery get-form-by-avustushaku "sql/hakija/form/get-by-avustushaku.sql")
(defquery get-form-by-id "sql/hakija/form/get.sql")
(defquery archive-form! "sql/hakija/form/archive.sql")
(defquery update-form! "sql/hakija/form/update.sql")
(defquery create-form<! "sql/hakija/form/create.sql")

(defquery list-attachments "sql/hakija/attachment/list.sql")
(defquery list-attachment-versions "sql/hakija/attachment/list-versions.sql")
(defquery list-attachments-by-avustushaku "sql/hakija/attachment/list-by-avustushaku.sql")
(defquery attachment-exists? "sql/hakija/attachment/exists.sql")
(defquery download-attachment "sql/hakija/attachment/download.sql")
(defquery download-attachment-version "sql/hakija/attachment/download-version.sql")

(defquery get-hakemus "sql/hakija/hakemus/get-by-id.sql")
(defquery get-hakemus-by-user-key "sql/hakija/hakemus/get-by-user-key.sql")
(defquery get-hakemus-with-answers "sql/hakija/hakemus/get-by-id-with-answers.sql")
(defquery list-hakemus-change-requests "sql/hakija/hakemus/list-change-requests-by-id.sql")
(defquery update-hakemus-status<! "sql/common/hakija/hakemus/update-status.sql")
(defquery update-loppuselvitys-status<! "sql/common/hakija/hakemus/update-loppuselvitys-status.sql")
(defquery update-valiselvitys-status<! "sql/common/hakija/hakemus/update-valiselvitys-status.sql")
(defquery lock-hakemus "sql/common/hakija/hakemus/lock.sql")
(defquery close-existing-hakemus! "sql/common/hakija/hakemus/close-existing.sql")
(defquery find-matching-hakemukset-by-organization-name "sql/hakija/hakemus/find-matching-by-organization-name.sql")

(defquery add-hakemus-paatos! "sql/hakija/hakemus/add-hakemus-paatos.sql")
(defquery update-hakemus-paatos-decision! "sql/hakija/hakemus/update-hakemus-paatos-decision.sql")
(defquery regenerate-hakemus-paatos-ids "sql/hakija/hakemus/regenerate-hakemus-paatos-ids.sql")

(defquery get-submission "sql/hakija/submission/get-by-id.sql")
(defquery find-paatos-views "sql/hakija/hakemus-paatokset/find.sql")
