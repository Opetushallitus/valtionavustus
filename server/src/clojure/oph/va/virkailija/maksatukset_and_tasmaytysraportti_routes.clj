(ns oph.va.virkailija.maksatukset-and-tasmaytysraportti-routes
  (:require
   [compojure.api.sweet :as compojure-api]
   [ring.util.http-response :refer [ok]]
   [oph.va.virkailija.payment-batches-data :as payment-data]
   [oph.va.virkailija.tasmaytysraportti :as tasmaytysraportti]))

(compojure-api/defroutes routes
  "Payments, payments emails, and tasmaytysraportti email in one single handy endpoint"

  (compojure-api/POST
    "/avustushaku/:avustushaku-id/payments-batch/:payments-batch-id" [:as request]
    :path-params [avustushaku-id :- Long payments-batch-id :- Long]
    :summary "Laheta maksatukset, maksatus meilit ja avustushakukohtainen täsmäytysraportti"
    (payment-data/send-payments-with-id payments-batch-id request)
    (payment-data/send-batch-emails payments-batch-id)
    (let [raportti (tasmaytysraportti/get-tasmaytysraportti-by-avustushaku-id avustushaku-id)]
      (tasmaytysraportti/send-tasmaytysraportti avustushaku-id raportti)
      (ok "ok"))))
