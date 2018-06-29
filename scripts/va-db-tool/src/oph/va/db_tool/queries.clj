(ns oph.va.db-tool.queries
  (:require [yesql.core :refer [defquery]]))

(defquery list-submitted-hakemus-answers-by-avustushaku-id "sql/list-submitted-hakemus-answers-by-avustushaku-id.sql")

(defquery update-hakemus-project-name! "sql/update-hakemus-project-name.sql")
