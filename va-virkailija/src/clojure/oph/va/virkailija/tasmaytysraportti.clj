(ns oph.va.virkailija.tasmaytysraportti
  (:require
   [clj-pdf.core :refer [pdf]]
   [clojure.java.io :refer [output-stream]]
   [clojure.java.jdbc :as jdbc]
   [oph.soresu.common.db :refer [execute!]]
   [clojure.tools.logging :as log]
   [oph.common.email :as email]
   [oph.soresu.common.db :refer [exec get-datasource]]
   [oph.va.virkailija.db.queries :as virkailija-queries]
   [oph.va.virkailija.scheduler :as scheduler]))

(def fields-of-interest
  {:toimintayksikko_koodi {:title "Toimintayksikkö" :width 7}
   :toimittajan_nimi {:title "Toimittajan nimi" :width 10}
   :pankkitili {:title "Pankkitili" :width 11}
   :bruttosumma {:title "Bruttosumma" :width 6}
   :pitka_viite {:title "Pitkä viite" :width 6}
   :lkp_tili {:title "LKP-tili" :width 5}
   :takp_tili {:title "TAKP-tili" :width 5}
   :asiatarkastaja {:title "Asiatarkastaja" :width 10}
   :hyvaksyja {:title "Hyväksyjä" :width 10}})

(defn pdf-cell [value]
  [:pdf-cell [:phrase {:size 10 :family :helvetica :color [0 0 0]} value]])

(defn pdf-table [header & rows]
  (into
   [:pdf-table
    {:width-percent 100
     :spacing-before 30
     :header header}
    (map (fn [[key value]] (:width (key fields-of-interest))) (first rows))]
   (map (partial map (fn [[key value]] (pdf-cell value))) rows)))

(defn get-bytes [x]
  (with-open [out (java.io.ByteArrayOutputStream.)]
    (clojure.java.io/copy (clojure.java.io/input-stream x) out)
    (.toByteArray out)))

(defn create-tasmaytysraportti [tasmaytysraportti_date data]
  (let [rows (map #(select-keys % (keys fields-of-interest)) data)
        header [(map #(:title (% fields-of-interest)) (keys (first rows)))]
        sum (reduce + (map #(:bruttosumma %) data))
        tmp-file (java.io.File/createTempFile "täsmäytysraportti" ".pdf")]

    (log/info (str "Creating täsmäytysraportti " tmp-file))

    (pdf
     [{:size :a4
       :title "Täsmäytysraportti"
       :orientation :landscape}
      [:pdf-table
       {:header [["Päivämäärä" "Kappalemäärä" "Bruttosumma"]]}
       [5 5 5]
       (map #(pdf-cell %) [tasmaytysraportti_date (count rows) sum])]
      (if (< 0 (count rows))
        (apply (partial pdf-table header) rows))]
     (output-stream tmp-file))

    (log/info (str "Done creating täsmäytysraportti " tmp-file))
    tmp-file))

(defn store-tasmaytysraportti [tasmaytysraportti_date tmp-file]
  (log/info (str "Storing täsmäytysraportti for " tasmaytysraportti_date))
  (jdbc/with-db-transaction [connection {:datasource (get-datasource)}]
    (jdbc/execute!
     connection
     ["INSERT INTO tasmaytysraportit (tasmaytysraportti_date, contents, created_at) VALUES (?, ?, current_date)" tasmaytysraportti_date (get-bytes tmp-file)]))
  (log/info (str "Succesfully stored täsmäytysraportti for " tasmaytysraportti_date)))

(defn maybe-create-tasmaytysraportti []
  (log/info "Looking for unreported maksatus rows")
  (let [data (exec virkailija-queries/get-unprosessed-tasmaytysraportti-data
                   {})
        rowcount (count data)]
    (if (> rowcount 0)
      (do
        (log/info (str "Found " rowcount " unreported maksatus rows"))
        (let [data-by-date (group-by :tasmaytysraportti_date data)
              dates (keys data-by-date)]
          (doseq [tasmaytysraportti_date dates]
            (log/info (str "Process unreported maksatus rows for " tasmaytysraportti_date))
            (let [data (get data-by-date tasmaytysraportti_date)
                  tmp-file (create-tasmaytysraportti tasmaytysraportti_date data)]
              (store-tasmaytysraportti tasmaytysraportti_date tmp-file)))))
      (log/info "No unreported maksatus rows found"))))

(defn store-successfully-sent-tasmaytysraportti [avustushaku-id to tasmaytysraportti]
  (execute! "INSERT INTO tasmaytysraportti 
            (avustushaku_id, contents, mailed_at, mailed_to)
            VALUES (?, ?, now(), ?)" [avustushaku-id tasmaytysraportti to]))

(defn send-tasmaytysraportti [avustushaku-id tasmaytysraportti]
  (let [subject (str "Valtionavustukset / Täsmäytysraportti / avustushaku " avustushaku-id)
        filename (str "valtionavustukset-tasmaytysraportti-avustushaku-" avustushaku-id ".pdf")
        to (:to-palkeet-ja-talouspalvelut email/smtp-config)]
    (try
      (email/try-send-msg-once {:from (-> email/smtp-config :from :fi)
                                :reply-to (-> email/smtp-config :bounce-address)
                                :sender (-> email/smtp-config :sender)
                                :subject subject
                                :to to
                                :type "tasmaytysraportti"
                                :lang "fi"
                                :attachment {:title filename
                                              :description subject
                                              :contents tasmaytysraportti}}
                                (fn [_] "Täsmäytysraportti liitteenä."))
      (store-successfully-sent-tasmaytysraportti avustushaku-id to tasmaytysraportti)
      (log/info (str "Succesfully send tasmaytysraportti for avustushaku " avustushaku-id))
      (catch Exception e
        (log/warn e (str "Failed to send tasmaytysraportti for avustushaku " avustushaku-id))))))

(defn send-unsent-tasmaytysraportti-mails []
  (log/info "Looking for unsent täsymäytysraportit")
  (jdbc/with-db-transaction [connection {:datasource (get-datasource)}]
    (let [rows (jdbc/query
                connection
                ["SELECT tasmaytysraportti_date, contents FROM tasmaytysraportit WHERE mailed_at IS NULL FOR UPDATE NOWAIT"])]
      (doseq [row rows]
        (let [tasmaytysraportti_date (:tasmaytysraportti_date row)
              subject (str "Valtionavustukset / Täsmäytysraportti / " tasmaytysraportti_date)
              filename (str "valtionavustukset-tasmaytysraportti-" tasmaytysraportti_date ".pdf")
              to (-> email/smtp-config :to-palkeet)]
          (try
            (email/try-send-msg-once {:from (-> email/smtp-config :from :fi)
                                      :reply-to (-> email/smtp-config :bounce-address)
                                      :sender (-> email/smtp-config :sender)
                                      :subject subject
                                      :to to
                                      :type "tasmaytysraportti"
                                      :lang "fi"
                                      :attachment {:title filename
                                                   :description subject
                                                   :contents (:contents row)}}
                                     (fn [_] "Täsmäytysraportti liitteenä."))
            (jdbc/execute!
             connection
             ["UPDATE tasmaytysraportit SET mailed_at = now(), mailed_to = ? WHERE tasmaytysraportti_date = ?" to tasmaytysraportti_date])
            (log/info (str "Succesfully send tasmaytysraportti for " tasmaytysraportti_date))
            (catch Exception e
              (log/warn e (str "Failed to send tasmaytysraportti for " tasmaytysraportti_date)))))))))

(defn get-tasmaytysraportti-by-avustushaku-id [avustushaku-id]
  (let [data (exec virkailija-queries/get-tasmaytysraportti-by-avustuskahu-id-data
                   {:avustushaku_id avustushaku-id})
        tasmaytysraportti_date (:tasmaytysraportti_date (first data))
        tmp-file (create-tasmaytysraportti tasmaytysraportti_date data)]
    (get-bytes tmp-file)))

(defonce ^:private scheduler-report (atom nil))
(defonce ^:private scheduler-mail (atom nil))

(defn start-schedule-create-tasmaytysraportti []
  (when (nil? @scheduler-report)
    (reset! scheduler-report
            (scheduler/after
             1
             :minute
             maybe-create-tasmaytysraportti))))

(defn stop-schedule-create-tasmaytysraportti []
  (when (some? @scheduler-report)
    (scheduler/stop @scheduler-report)
    (reset! scheduler-report nil)))

(defn start-schedule-send-tasmaytysraportti []
  (when (nil? @scheduler-mail)
    (reset! scheduler-mail
            (scheduler/after
             1
             :minute
             send-unsent-tasmaytysraportti-mails))))

(defn stop-schedule-send-tasmaytysraportti []
  (when (some? @scheduler-mail)
    (scheduler/stop @scheduler-mail)
    (reset! scheduler-mail nil)))
