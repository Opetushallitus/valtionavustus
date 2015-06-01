(ns oph.va.spec-plumbing)

(defmacro wrap-exception [& f]
  `(try ~@f
    (catch Throwable e# (.printStackTrace e# ))))
