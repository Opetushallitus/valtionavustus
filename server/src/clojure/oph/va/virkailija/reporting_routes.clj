(ns oph.va.virkailija.reporting-routes
  (:require
    [compojure.api.sweet :as compojure-api]
    [oph.va.virkailija.export :refer [export-loppuselvitysraportti]]
    [ring.util.http-response :refer [ok]]
    [oph.va.virkailija.reporting-data :as data]
    [oph.va.virkailija.tasmaytysraportti :as tasmaytysraportti])
  (:import [java.io ByteArrayInputStream]))

(compojure-api/defroutes routes
  "Reports"

  (compojure-api/GET
   "/loppuselvitykset/loppuselvitysraportti.xlsx" request
   :summary "Loppuselvitysraportti"
   (let [asiatarkastettu-rows (data/asiatarkastetut-rows)
         asiatastamatta-rows (data/get-loppuselvitys-asiatarkastamatta-rows)
         document (-> (export-loppuselvitysraportti asiatarkastettu-rows asiatastamatta-rows)
                      (ByteArrayInputStream.))]
     (-> (ok document)
         (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
         (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"loppuselvitysraportti.xlsx\"")))))

  (compojure-api/GET
   "/tasmaytys/avustushaku/:avustushaku-id" []
   :path-params [avustushaku-id :- Long]
   :summary "Avustushakukohtainen täsmäytysraportti"
   (let [document (-> (tasmaytysraportti/get-tasmaytysraportti-by-avustushaku-id avustushaku-id)
                      (ByteArrayInputStream.))]
     (-> (ok document)
         (assoc-in [:headers "Content-Type"] "application/pdf")
         (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"tasmaytysraportti-avustushaku-" avustushaku-id ".pdf\""))))))
