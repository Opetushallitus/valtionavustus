(ns oph.common.retry)

(defn try-n-times [f n]
  (try
    (f)
    (catch Throwable t
      (if (pos? n)
        (try-n-times f (dec n))
        (throw t)))))

(defmacro try3 [& body]
  `(try-n-times (fn [] ~@body) 3))
