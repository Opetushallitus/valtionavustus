(ns oph.va.hakija.db.queries
  (:require [yesql.core :refer [defquery]]))

(defquery health-check "sql/healthcheck.sql")

(defquery create-hakemus<! "sql/hakemus/create.sql")
(defquery get-hakemus-by-user-id "sql/hakemus/get_by_user_id.sql")
(defquery update-hakemus-submission<! "sql/hakemus/update-submission.sql")
(defquery update-hakemus-status<! "sql/common/hakija/hakemus/update-status.sql")
(defquery lock-hakemus "sql/common/hakija/hakemus/lock.sql")
(defquery close-existing-hakemus! "sql/common/hakija/hakemus/close-existing.sql")

(defquery get-avustushaku "sql/avustushaku/get.sql")
(defquery list-avustushaut "sql/avustushaku/list.sql")
(defquery archive-avustushaku! "sql/avustushaku/archive.sql")
(defquery update-avustushaku!  "sql/avustushaku/update.sql")

(defquery attachment-exists? "sql/attachment/exists.sql")
(defquery list-attachments "sql/attachment/list.sql")
(defquery download-attachment "sql/attachment/download.sql")
(defquery create-attachment<! "sql/attachment/create.sql")
(defquery update-attachment<! "sql/attachment/update.sql")
(defquery close-existing-attachment! "sql/attachment/close-existing.sql")

(defquery register-number-sequence-exists? "sql/register-number-sequence/exists.sql")
(defquery create-register-number-sequence<! "sql/register-number-sequence/create.sql")
(defquery update-register-number-sequence<! "sql/register-number-sequence/update.sql")
