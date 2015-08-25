(ns oph.common.server
  (:use [org.httpkit.server :only [run-server]])
  (:require [clojure.tools.logging :as log])
  (:import (java.net Socket)
           (java.io IOException)))

(defn- fail-if-server-running [host port]
  (try
    (let [socket (Socket. host port)]
      (.close socket)
      (throw (Exception. (format "Server is already running %s:%d" host port))))
    (catch IOException e)))

(defn start-server [{:keys [host port auto-reload? routes on-startup on-shutdown]}]
  (fail-if-server-running host port)
  (on-startup)
  (log/info (format "Starting server in URL http://%s:%d/" host port))
  (let [stop (run-server routes {:host host :port port})]
    (.addShutdownHook (Runtime/getRuntime) (Thread. on-shutdown))
    ;; Return stop-function with our own shutdown
    (fn []
      (stop)
      (on-shutdown))))
