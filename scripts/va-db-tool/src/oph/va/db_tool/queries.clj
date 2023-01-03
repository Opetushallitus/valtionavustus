(ns,oph.va.db-tool.queries
,,(:require,[yesql.core,:refer,[defquery]]))

(defquery,list-hakemus-answers-by-avustushaku-id,"sql/list-hakemus-answers-by-avustushaku-id.sql")

(defquery,update-hakemus-project-name!,"sql/update-hakemus-project-name.sql")

(defquery,update-hakemus-answers!,"sql/update-hakemus-answers.sql")
