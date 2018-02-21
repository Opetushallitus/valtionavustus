(ns oph.common.log4j-spec
  (:require [speclj.core :refer :all])
  (:import [org.apache.log4j Level Logger]
           [org.apache.log4j.spi LoggingEvent]
           [oph.common.log4j SMTPThrottle]))

(defn- make-throttle
  ([^Long wait-interval-ms ^Level level-threshold]
   (SMTPThrottle. wait-interval-ms level-threshold))
  ([]
   (make-throttle 100 Level/ERROR)))

(defn- make-event [level ts]
  (LoggingEvent. "test" (Logger/getLogger "TestLogger") ts level "test message" nil))

(defn- throttle-event [throttle event-level event-ts]
  (.isTriggeringEvent throttle (make-event event-level event-ts)))

(describe "SMTPThrottle"
  (it "triggers event higher than threshold"
    (should= true (throttle-event (make-throttle) Level/FATAL 1)))

  (it "does not trigger event less than threshold"
    (should= false (throttle-event (make-throttle) Level/WARN 1)))

  (it "triggers event equal to threshold when no previous event"
    (should= true (throttle-event (make-throttle) Level/ERROR 1)))

  (it "throttles event equal to threshold"
    (let [throttle (make-throttle)]
      (should= true  (throttle-event throttle Level/ERROR 100))
      (should= false (throttle-event throttle Level/ERROR 101))
      (should= false (throttle-event throttle Level/ERROR 102))
      (should= false (throttle-event throttle Level/ERROR 200))
      (should= true  (throttle-event throttle Level/ERROR 201))))

  (it "receiving event higher than threshold resets throttle"
    (let [throttle (make-throttle)]
      (should= true  (throttle-event throttle Level/ERROR 100))
      (should= false (throttle-event throttle Level/ERROR 101))
      (should= true  (throttle-event throttle Level/FATAL 102))
      (should= false (throttle-event throttle Level/ERROR 102))
      (should= false (throttle-event throttle Level/ERROR 103))
      (should= false (throttle-event throttle Level/ERROR 202))
      (should= true  (throttle-event throttle Level/ERROR 203)))))

(run-specs)
