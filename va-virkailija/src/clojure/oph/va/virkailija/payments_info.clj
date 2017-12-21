(ns oph.va.virkailija.payments_info
  (:require
   [ring.util.http-response :refer :all]
   [oph.va.virkailija.email :as email]
   [clojure.tools.logging :as log]))

(defn send-payments-info [payments-info]
  (log/info "send-payments-info-to-finance" (:avustushaku-id payments-info))
  (email/send-payments-info-to-finance! payments-info)
  (ok {:response "sent e-mail to finance"}))
