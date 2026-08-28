(ns oph.va.virkailija.maksatukset-and-tasmaytysraportti-routes
  (:require
   [compojure.api.sweet :as compojure-api]
   [ring.util.http-response :refer [ok accepted not-found conflict]]
   [oph.va.virkailija.authentication :as authentication]
   [oph.va.virkailija.payment-batches-data :as payment-data]
   [oph.va.virkailija.schema :as schema]))

(compojure-api/defroutes routes
  "Payments, payments emails, and tasmaytysraportti email in one single handy endpoint"

  (compojure-api/POST
    "/avustushaku/:avustushaku-id/payments-batch/:payments-batch-id" [:as request]
    :path-params [avustushaku-id :- Long payments-batch-id :- Long]
    :summary "Laheta maksatukset, maksatus meilit ja avustushakukohtainen täsmäytysraportti"
    (if (payment-data/start-send-job! avustushaku-id payments-batch-id
                                      (authentication/get-request-identity request))
      (accepted {:batch-id payments-batch-id :send-status "sending"})
      (conflict {:error "Maksatuserän lähetys on jo käynnissä"})))

  (compojure-api/GET
    "/avustushaku/:avustushaku-id/payments-batch/:payments-batch-id/status" []
    :path-params [avustushaku-id :- Long payments-batch-id :- Long]
    :return schema/PaymentBatchSendStatus
    :summary "Maksatuserän lähetyksen tila"
    (if-let [status (payment-data/get-batch-send-status payments-batch-id)]
      (ok status)
      (not-found))))
