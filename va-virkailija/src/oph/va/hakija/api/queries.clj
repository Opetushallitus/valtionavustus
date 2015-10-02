(ns oph.va.hakija.api.queries
  (:require [yesql.core :refer [defquery]]))

(defquery health-check "sql/hakija/healthcheck.sql")

(defquery create-avustushaku<! "sql/hakija/avustushaku/create.sql")
(defquery update-avustushaku! "sql/hakija/avustushaku/update.sql")
(defquery archive-avustushaku! "sql/hakija/avustushaku/archive.sql")
(defquery list-avustushaut "sql/hakija/avustushaku/list.sql")
(defquery get-avustushaku "sql/hakija/avustushaku/get.sql")
(defquery create-avustushaku-role<! "sql/hakija/avustushaku/create-role.sql")
(defquery get-avustushaku-role "sql/hakija/avustushaku/get-role.sql")
(defquery update-avustushaku-role! "sql/hakija/avustushaku/update-role.sql")
(defquery delete-avustushaku-role! "sql/hakija/avustushaku/delete-role.sql")
(defquery get-avustushaku-roles "sql/hakija/avustushaku/get-roles.sql")
(defquery list-hakemukset-by-avustushaku "sql/hakija/hakemus/list-by-avustushaku.sql")
(defquery copy-form<! "sql/hakija/form/copy.sql")
(defquery get-form-by-avustushaku "sql/hakija/form/get-by-avustushaku.sql")

(defquery list-attachments "sql/hakija/attachment/list.sql")
(defquery list-attachments-by-avustushaku "sql/hakija/attachment/list-by-avustushaku.sql")
(defquery attachment-exists? "sql/hakija/attachment/exists.sql")
(defquery download-attachment "sql/hakija/attachment/download.sql")
