(ns va-payments-ui.payments
  (:require [va-payments-ui.utils :refer [no-nils? valid-email?]]))

(defn valid-payment-values?
  [values]
  (and (no-nils? values
                 [:transaction-account :due-date :invoice-date :document-type
                  :receipt-date])
       (valid-email? (:inspector-email values))
       (valid-email? (:acceptor-email values))))
