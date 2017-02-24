(ns oph.common.testing.spec-plumbing
  (:use [oph.soresu.common.config :only [config]])
  (:require [oph.soresu.common.db :as db]))

(defmacro wrap-exception [& form]
  `(try ~@form
    (catch Throwable e# (.printStackTrace e# ))))

(defmacro with-test-server! [ds-key server-starter & form]
  `(do
     (wrap-exception (db/clear-db-and-grant! ~ds-key (-> config ~ds-key :schema) (-> config :grant-select-for-other-db-user)))
     (let [stop-server# (wrap-exception (~server-starter))]
       (try
         ~@form
         (finally
           (when stop-server#
             (stop-server#)))))))
