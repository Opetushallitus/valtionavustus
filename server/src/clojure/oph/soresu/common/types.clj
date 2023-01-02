(ns oph.soresu.common.types)

(defn sequential-of? [^Class expected-class-of-first obj]
  (if (sequential? obj)
    (let [s (seq obj)]
      (if s
        (identical? (class (first s)) expected-class-of-first)
        true))
    false))

(defn sequential-2d-of? [^Class expected-class-of-first obj]
  (if (sequential? obj)
    (let [s (seq obj)]
      (if s
        (sequential-of? expected-class-of-first (first s))
        true))
    false))
