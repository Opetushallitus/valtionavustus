(ns oph.va.admin-ui.prod
  (:require
    [oph.va.admin-ui.core :as core]))

;;ignore println statements in prod
(set! *print-fn* (fn [& _]))

(core/init!)
