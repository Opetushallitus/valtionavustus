(ns oph.va.virkailija.spec-plumbing
  (:use [oph.common.config :only [config]])
  (:require [oph.va.virkailija.server :refer :all]
            [oph.common.db :as db]))

(defmacro wrap-exception [& form]
  `(try ~@form
    (catch Throwable e# (.printStackTrace e# ))))

(defmacro with-test-server! [& form]
  `(do
     (wrap-exception (db/clear-db! (-> config :db :schema)))
     (let [stop-server# (wrap-exception (start-server "localhost" 9000 false))]
       (try
         ~@form
         (finally
           (when stop-server#
             (stop-server#)))))))
