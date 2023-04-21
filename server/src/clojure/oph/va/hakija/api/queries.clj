(ns oph.va.hakija.api.queries
  (:require [yesql.core :refer [defquery]]))

(defquery health-check "sql/hakija/healthcheck.sql")

(defquery create-avustushaku<! "sql/hakija/avustushaku/create.sql")
(defquery update-avustushaku! "sql/hakija/avustushaku/update.sql")
(defquery update-form-loppuselvitys! "sql/hakija/avustushaku/update-form-loppuselvitys.sql")
(defquery update-form-valiselvitys! "sql/hakija/avustushaku/update-form-valiselvitys.sql")
(defquery archive-avustushaku<! "sql/hakija/avustushaku/archive.sql")
(defquery list-avustushaut-by-status "sql/hakija/avustushaku/list-by-status.sql")
(defquery list-avustushaut-not-deleted "sql/hakija/avustushaku/list-not-deleted.sql")
(defquery get-avustushaku "sql/hakija/avustushaku/get.sql")
(defquery get-avustushaku-by-status "sql/hakija/avustushaku/get-by-status.sql")
(defquery create-avustushaku-role<! "sql/hakija/avustushaku/create-role.sql")
(defquery get-avustushaku-role "sql/hakija/avustushaku/get-role.sql")
(defquery delete-avustushaku-role! "sql/hakija/avustushaku/delete-role.sql")
(defquery get-avustushaku-roles "sql/hakija/avustushaku/get-roles.sql")
(defquery get-avustushaku-role-by-avustushaku-id-and-person-oid "sql/hakija/avustushaku/get-role-by-avustushaku-id-and-person-oid.sql")
(defquery list-matching-avustushaut-by-ids "sql/hakija/avustushaku/list-matching-by-ids.sql")
(defquery get-avustushakus-for-listing "sql/hakija/avustushaku/get-avustushakus-for-listing.sql")

(defquery list-hakemukset-by-avustushaku "sql/hakija/hakemus/list-by-avustushaku.sql")
(defquery list-hakemukset-for-export-by-type-and-avustushaku "sql/hakija/hakemus/list-for-export-by-type-and-avustushaku.sql")
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
(defquery create-application-token "sql/hakija/hakemus/create-application-token.sql")
(defquery revoke-application-tokens
  "sql/hakija/hakemus/revoke-application-tokens.sql")
(defquery get-application "sql/hakija/hakemus/get-application.sql")
(defquery get-application-token "sql/hakija/hakemus/get-application-token.sql")
(defquery find-applications "sql/hakija/hakemus/find-applications.sql")
(defquery find-applications-asc "sql/hakija/hakemus/find-applications-asc.sql")
(defquery get-applications-by-grant
  "sql/hakija/hakemus/get-applications-by-grant.sql")
(defquery find-application-by-register-number
  "sql/hakija/hakemus/find-application-by-register-number.sql")

(defquery add-hakemus-paatos! "sql/hakija/hakemus/add-hakemus-paatos.sql")
(defquery update-hakemus-paatos! "sql/hakija/hakemus/update-hakemus-paatos.sql")
(defquery update-hakemus-paatos-decision! "sql/hakija/hakemus/update-hakemus-paatos-decision.sql")
(defquery regenerate-hakemus-paatos-ids "sql/hakija/hakemus/regenerate-hakemus-paatos-ids.sql")

(defquery get-submission "sql/hakija/submission/get-by-id.sql")
(defquery find-paatos-views "sql/hakija/hakemus-paatokset/find.sql")

(defquery list-open-applications
  "sql/hakija/hakemus/list-open.sql")
(defquery get-application-id-by-token
  "sql/hakija/hakemus/get-application-id-by-token.sql")
