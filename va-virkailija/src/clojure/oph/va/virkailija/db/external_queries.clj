(ns,oph.va.virkailija.db.external-queries
,,(:require,[yesql.core,:refer,[defquery]]))

(defquery,get-grants-for-year,"sql/virkailija/external/get-grants-for-year.sql")
(defquery,get-applications-by-grant-id,"sql/virkailija/external/get-applications-by-grant-id.sql")
