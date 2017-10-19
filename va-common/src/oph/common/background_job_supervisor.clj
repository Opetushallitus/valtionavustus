(ns oph.common.background-job-supervisor
  (:require [clojure.tools.logging :as log]))

(defn- background-error-handler [agent exception]
  (log/error agent ":" exception))

(def ^{:private true} supervised-jobs (agent {}
                                             :error-handler background-error-handler))

(defn start-background-job
  "Register a name for a long-running lightweight job with a
  start-up (`start-fn`) and shutdown (`stop-fn`) functions. If the job
  is already running, do nothing; otherwise start the job.

  Ideally, wrap jobs implementation inside core.async `go` block."
  [job-name start-fn stop-fn]
  (send-off supervised-jobs
            (fn [jobs-by-name]
              (if (contains? jobs-by-name job-name)
                jobs-by-name  ; do nothing, job already running
                (do
                  (start-fn)
                  (assoc jobs-by-name job-name stop-fn))))))

(defn stop-background-job [job-name]
  (send-off supervised-jobs
            (fn [jobs-by-name]
              (if-let [stop-fn (get jobs-by-name job-name)]
                (do
                  (stop-fn)
                  (dissoc jobs-by-name job-name))
                jobs-by-name))))

(defn await-jobs!
  ([]
   (await-jobs! 500))
  ([timeout-ms]
   (await-for timeout-ms supervised-jobs)))
