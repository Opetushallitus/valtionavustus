(ns oph.va.virkailija.db.queries
  (:require [yesql.core :refer [defquery]]))

(defquery health-check "sql/healthcheck.sql")

(defquery create-empty-arvio<! "sql/virkailija/arvio/create-empty.sql")
(defquery create-arvio<! "sql/virkailija/arvio/create.sql")
(defquery update-arvio<! "sql/virkailija/arvio/update.sql")
(defquery get-arviot "sql/virkailija/arvio/get-by-ids.sql")
(defquery get-accepted-or-rejected-hakemus-ids "sql/virkailija/arvio/accepted-or-rejected-hakemus-ids-by-ids.sql")
(defquery get-accepted-hakemus-ids "sql/virkailija/arvio/get-accepted-hakemus-ids.sql")
(defquery get-arvio "sql/virkailija/arvio/get.sql")

(defquery create-comment<! "sql/virkailija/comment/create.sql")
(defquery list-comments "sql/virkailija/comment/list.sql")

(defquery create-score<! "sql/virkailija/score/create.sql")
(defquery update-score<! "sql/virkailija/score/update.sql")
(defquery list-scores "sql/virkailija/score/list.sql")
(defquery list-avustushaku-scores "sql/virkailija/score/list-by-avustushaku.sql")

(defquery find-search "sql/virkailija/saved_search/find.sql")
(defquery create-search<! "sql/virkailija/saved_search/create.sql")
(defquery get-search "sql/virkailija/saved_search/get.sql")
