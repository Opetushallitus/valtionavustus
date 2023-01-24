(ns oph.va.virkailija.reporting-routes
  (:require
    [compojure.api.sweet :as compojure-api]
    [oph.va.virkailija.export :refer [export-loppuselvitysraportti]]
    [schema.core :as s]
    [ring.util.http-response :refer [ok]]
    [oph.va.virkailija.schema :as schema]
    [oph.va.virkailija.reporting-data :as data]
    [oph.va.virkailija.tasmaytysraportti :as tasmaytysraportti])
  (:import [java.io ByteArrayInputStream]))

(compojure-api/defroutes routes
  "Reports"

  (compojure-api/GET
    "/" request
    :return s/Any
    :summary "Simple yearly reporting overview"
    (ok (data/get-yearly-report)))

  (compojure-api/GET
    "/grants/" request
    :return schema/YearlyReport
    :summary "Yearly resolved grants report"
    (ok (data/get-yearly-resolved-count)))

  (compojure-api/GET
    "/applications/" request
    :query-params [applications-filter :- s/Str]
    :return schema/YearlyReport
    :summary "Yearly applications count"
    (ok
      (case applications-filter
        "count" (data/get-yearly-application-count)
        "accepted" (data/get-accepted-count-by-year)
        "rejected" (data/get-rejected-count-by-year))))

  (compojure-api/GET
    "/loppuselvitykset/" request
    :return schema/YearlyReport
    :summary "Lähetetyt loppuselvitykset vuosittain"
    (ok (data/get-loppuselvitykset-yearly)))
  (compojure-api/GET
    "/loppuselvitykset/loppuselvitysraportti.xlsx" request
    :summary "Lähetetyt loppuselvitykset vuosittain Excel-raportti"
    (let [document (-> (data/get-loppuselvitykset-yearly)
                       export-loppuselvitysraportti
                       (ByteArrayInputStream.))]
      (-> (ok document)
          (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
          (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"loppuselvitysraportti.xlsx\"")))))
  (compojure-api/GET
    "/education-levels/" request
    :return s/Any
    :summary "Yearly education levels"
    (ok (data/get-yearly-education-levels)))

  (compojure-api/GET
   "/tasmaytys/avustushaku/:avustushaku-id" []
   :path-params [avustushaku-id :- Long]
   :summary "Avustushakukohtainen täsmäytysraportti"
   (let [document (-> (tasmaytysraportti/get-tasmaytysraportti-by-avustushaku-id avustushaku-id)
                      (ByteArrayInputStream.))]
     (-> (ok document)
         (assoc-in [:headers "Content-Type"] "application/pdf")
         (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"tasmaytysraportti-avustushaku-" avustushaku-id ".pdf\""))))))
