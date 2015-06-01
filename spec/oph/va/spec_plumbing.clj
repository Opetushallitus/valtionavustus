(ns oph.va.spec-plumbing
  (:require [oph.va.server :refer :all]
            [oph.va.db :as db]))

(defmacro wrap-exception [& form]
  `(try ~@form
    (catch Throwable e# (.printStackTrace e# ))))

(defmacro with-test-server! [& form]
  `(do
     (wrap-exception (db/clear-db!))
     (let [stop-server# (wrap-exception (start-server "localhost" 9000 false))]
       (try
         ~@form
         (finally
           (when stop-server#
             (stop-server#)))))))
