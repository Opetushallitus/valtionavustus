(ns oph.common.log4j
  (:import [org.apache.log4j Level]))

(gen-class :name oph.common.log4j.SMTPThrottle
           :state state
           :implements [org.apache.log4j.spi.TriggeringEventEvaluator]
           :init init
           :constructors {[Long org.apache.log4j.Level] []
                          [] []})

(defn- system-property-name-for [name]
  (str "oph.common.log4j.SMTPThrottle." name))

(defn- get-system-property-as-long [name default-val]
  (let [set-val (Long/getLong (system-property-name-for name) default-val)]
    (if (< set-val 0) default-val set-val)))

(defn- get-system-property-as-str [name default-val]
  (System/getProperty (system-property-name-for name) default-val))

(defn -init
  ([^Long wait-interval-ms ^Level level-threshold]
   [[]
    (atom {:wait-interval-ms        (max 0 wait-interval-ms)
           :last-triggered-event-ts nil
           :level-threshold-int     (.toInt level-threshold)
           :triggers-event?         false})])

  ([] (-init (* 1000 (get-system-property-as-long "waitIntervalS" (* 5 60)))
             (Level/toLevel (get-system-property-as-str "threshold" "ERROR") Level/ERROR))))

(defn- trigger-event [state event-ts event-level-int]
  (let [{:keys [wait-interval-ms
                last-triggered-event-ts
                level-threshold-int]}   state]
    (cond
      (> event-level-int level-threshold-int)
      (merge state {:last-triggered-event-ts event-ts
                    :triggers-event?         true})

      (< event-level-int level-threshold-int)
      (assoc state :triggers-event? false)

      (nil? last-triggered-event-ts)
      (merge state {:last-triggered-event-ts event-ts
                    :triggers-event?         true})

      (> event-ts (+ last-triggered-event-ts wait-interval-ms))
      (merge state {:last-triggered-event-ts event-ts
                    :triggers-event?         true})

      :else
      (assoc state :triggers-event? false))))

(defn -isTriggeringEvent [this event]
  (let [event-ts                           (.getTimeStamp event)
        event-level-int                    (.toInt (.getLevel event))
        {triggers-event? :triggers-event?} (swap! (.state this) trigger-event event-ts event-level-int)]
    triggers-event?))
