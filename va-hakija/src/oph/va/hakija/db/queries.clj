(ns oph.va.hakija.db.queries
  (:require [yesql.core :refer [defquery]]))

(defquery health-check "sql/healthcheck.sql")

(defquery create-hakemus<! "sql/hakemus/create.sql")
(defquery update-hakemus-parent-id! "sql/hakemus/update-parent-id.sql")
(defquery find-by-parent-id-and-hakemus-type "sql/hakemus/find-by-parent-id-and-hakemus-type.sql")
(defquery get-hakemus-by-user-id "sql/hakemus/get_by_user_id.sql")
(defquery get-hakemus-paatokset "sql/hakemus-paatokset/get.sql")
(defquery list-hakemus-change-requests-by-user-id "sql/hakemus/list-change-requests-by-user-id.sql")
(defquery update-hakemus-submission<! "sql/hakemus/update-submission.sql")
(defquery update-hakemus-status<! "sql/common/hakija/hakemus/update-status.sql")
(defquery lock-hakemus "sql/common/hakija/hakemus/lock.sql")
(defquery update-loppuselvitys-status<! "sql/common/hakija/hakemus/update-loppuselvitys-status.sql")
(defquery update-valiselvitys-status<! "sql/common/hakija/hakemus/update-valiselvitys-status.sql")
(defquery close-existing-hakemus! "sql/common/hakija/hakemus/close-existing.sql")

(defquery get-avustushaku "sql/avustushaku/get.sql")
(defquery list-avustushaut "sql/avustushaku/list.sql")
(defquery archive-avustushaku! "sql/avustushaku/archive.sql")
(defquery update-avustushaku!  "sql/avustushaku/update.sql")
(defquery create-paatos-view!  "sql/hakemus-paatokset-views/create.sql")

(defquery attachment-exists? "sql/attachment/exists.sql")
(defquery list-attachments "sql/attachment/list.sql")
(defquery download-attachment "sql/attachment/download.sql")
(defquery create-attachment<! "sql/attachment/create.sql")
(defquery update-attachment<! "sql/attachment/update.sql")
(defquery close-existing-attachment! "sql/attachment/close-existing.sql")

(defquery register-number-sequence-exists? "sql/register-number-sequence/exists.sql")
(defquery create-register-number-sequence<! "sql/register-number-sequence/create.sql")
(defquery update-register-number-sequence<! "sql/register-number-sequence/update.sql")
