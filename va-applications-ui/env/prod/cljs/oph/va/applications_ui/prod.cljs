(ns oph.va.applications-ui.prod
  (:require
    [oph.va.applications-ui.core :as core]))

;;ignore println statements in prod
(set! *print-fn* (fn [& _]))

(core/init!)
