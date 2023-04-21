(ns oph.va.virkailija.reports.routes
  (:require
    [compojure.api.sweet :as compojure-api]
    [oph.va.virkailija.reports.loppuselvitysraportti :refer [export-loppuselvitysraportti]]
    [ring.util.http-response :refer [ok]]
    [oph.va.virkailija.tasmaytysraportti :as tasmaytysraportti])
  (:import [java.io ByteArrayInputStream]))

(compojure-api/defroutes routes
  "Reports"

  (compojure-api/GET
   "/loppuselvitykset/loppuselvitysraportti.xlsx" []
   :summary "Loppuselvitysraportti"
    (-> (ok (ByteArrayInputStream. (export-loppuselvitysraportti)))
        (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
        (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"loppuselvitysraportti.xlsx\""))))

  (compojure-api/GET
   "/tasmaytys/avustushaku/:avustushaku-id" []
   :path-params [avustushaku-id :- Long]
   :summary "Avustushakukohtainen täsmäytysraportti"
   (let [document (-> (tasmaytysraportti/get-tasmaytysraportti-by-avustushaku-id avustushaku-id)
                      (ByteArrayInputStream.))]
     (-> (ok document)
         (assoc-in [:headers "Content-Type"] "application/pdf")
         (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"tasmaytysraportti-avustushaku-" avustushaku-id ".pdf\""))))))
