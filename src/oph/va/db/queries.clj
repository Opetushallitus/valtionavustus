(ns oph.va.db.queries
  (:require [yesql.core :refer [defquery]]))

(defquery create-hakemus<! "sql/hakemus/create.sql")
(defquery get-hakemus-by-user-id "sql/hakemus/get_by_user_id.sql")
(defquery get-hakemus-by-internal-id "sql/hakemus/get_by_internal_id.sql")
(defquery submit-hakemus<! "sql/hakemus/submit.sql")

(defquery get-avustushaku "sql/avustushaku/get.sql")
