(ns oph.va.admin-ui.payments
  (:require [oph.va.admin-ui.utils :refer [no-nils? valid-email?]]))

(defn valid-batch-values?
  [values]
  (and (no-nils? values
                 [:transaction-account :due-date :invoice-date :document-type
                  :receipt-date])
       (valid-email? (:inspector-email values))
       (valid-email? (:acceptor-email values))))
