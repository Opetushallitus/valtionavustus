(ns va-payments-ui.prod
  (:require
    [va-payments-ui.core :as core]))

;;ignore println statements in prod
(set! *print-fn* (fn [& _]))

(core/init!)
