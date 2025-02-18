(ns oph.va.virkailija.tasmaytysraportti
  (:require
   [clj-pdf.core :refer [pdf]]
   [clojure.java.io :refer [output-stream]]
   [clojure.java.jdbc :as jdbc]
   [oph.soresu.common.db :refer [execute!]]
   [clojure.tools.logging :as log]
   [oph.common.email :as email]
   [oph.soresu.common.db :refer [exec get-datasource query]]
   [dk.ative.docjure.spreadsheet :as spreadsheet]
   [oph.va.virkailija.export :as export]
   [oph.va.virkailija.db.queries :as virkailija-queries])
  (:import (java.io ByteArrayOutputStream)
           (org.apache.poi.ss.usermodel Cell CellStyle CellType Sheet Workbook)))

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

(defn payments-to-excel-rows [payments]
  (let [column-titles ["Haun nimi"
                       "Toimittajan nimi"
                       "TAKP-tili"
                       "LKP-tili"
                       "Projektikoodi"
                       "Toimintayksikkö"
                       "Pankkitili"
                       "Pitkä viite"
                       "Bruttosumma"
                       "Asiatarkastaja"
                       "Hyväksyjä"]]
    (vec (cons column-titles
               (map (fn [row] [(row :haun-nimi)
                               (row :toimittajan-nimi)
                               (row :takp-tili)
                               (row :lkp-tili)
                               (row :projektikoodi)
                               (row :toimintayksikko)
                               (row :pankkitili)
                               (row :pitka-viite)
                               (row :bruttosumma)
                               (row :asiatarkastaja)
                               (row :hyvaksyja)]) payments)))))

(defn is-last-month-tasmaytysraportti-already-added-to-email-queue? []
  (let [res (first (query "
  SELECT EXISTS
    (SELECT 1
       FROM virkailija.email_event
       WHERE email_type = 'kuukausittainen-tasmaytysraportti'
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
         AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month');" []))]
    (:exists res)))

(defn create-excel-tasmaytysraportti []
  (let [main-sheet-name       "Täsmäytysraportti"
        output                (ByteArrayOutputStream.)
        last-month-payments   (query "SELECT *
FROM virkailija.v_tasmaytysraportti_excel_data
WHERE lahetetty_maksatuspalveluun >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  AND lahetetty_maksatuspalveluun < DATE_TRUNC('month', CURRENT_DATE)
ORDER BY avustushaku DESC"
                                     [])
        sheet-data (payments-to-excel-rows last-month-payments)
        wb                    (spreadsheet/create-workbook main-sheet-name sheet-data)
        main-sheet            {:sheet              (spreadsheet/select-sheet main-sheet-name wb)
                               :header-row-indexes #{0}}
        safe-formula-style    (doto (.createCellStyle wb) (.setQuotePrefixed true))
        header-style          (spreadsheet/create-cell-style! wb {:background :orange
                                                                  :font {:bold true :color :white}})]
    (export/adjust-cells-style! main-sheet header-style safe-formula-style)
    (.write wb output)
    (.toByteArray output)))

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
                                :email-type "tasmaytysraportti"
                                :lang "fi"
                                :attachment {:title filename
                                             :description subject
                                             :contents tasmaytysraportti}}
                               (fn [_] "Täsmäytysraportti liitteenä."))
      (store-successfully-sent-tasmaytysraportti avustushaku-id to tasmaytysraportti)
      (log/info (str "Successfully send tasmaytysraportti for avustushaku " avustushaku-id))
      (catch Exception e
        (log/error e (str "Failed to send tasmaytysraportti for avustushaku " avustushaku-id))))))

(defn get-tasmaytysraportti-by-avustushaku-id [avustushaku-id]
  (let [data (exec virkailija-queries/get-tasmaytysraportti-by-avustushaku-id-data
                   {:avustushaku_id avustushaku-id})
        tasmaytysraportti_date (:tasmaytysraportti_date (first data))
        tmp-file (create-tasmaytysraportti tasmaytysraportti_date data)]
    (get-bytes tmp-file)))
