(ns oph.va.spec-plumbing)

(defn wrap-exception [f]
  (fn []
    (try (f [])
      (catch Throwable e (println (.getMessage e)))))
)
