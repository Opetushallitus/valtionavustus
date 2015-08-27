(ns oph.common.testing.spec-plumbing
  (:use [oph.common.config :only [config]])
  (:require [oph.common.db :as db]))

(defmacro wrap-exception [& form]
  `(try ~@form
    (catch Throwable e# (.printStackTrace e# ))))

(defmacro with-test-server! [ds-key server-starter & form]
  `(do
     (wrap-exception (db/clear-db! ~ds-key (-> config ~ds-key :schema)))
     (let [stop-server# (wrap-exception (~server-starter))]
       (try
         ~@form
         (finally
           (when stop-server#
             (stop-server#)))))))
