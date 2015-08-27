(ns oph.common.testing.spec-plumbing
  (:use [oph.common.config :only [config]])
  (:require [oph.common.db :as db]))

(defmacro wrap-exception [& form]
  `(try ~@form
    (catch Throwable e# (.printStackTrace e# ))))

(defmacro with-test-server! [server-starter & form]
  `(do
     (wrap-exception (db/clear-db! (-> config :db :schema)))
     (let [stop-server# (wrap-exception (~server-starter))]
       (try
         ~@form
         (finally
           (when stop-server#
             (stop-server#)))))))
