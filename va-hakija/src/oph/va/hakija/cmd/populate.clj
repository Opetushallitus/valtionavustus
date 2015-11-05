(ns oph.va.hakija.cmd.populate
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.hakija.db :refer :all]
            [oph.soresu.form.validation :as validation]
            [oph.soresu.form.db :refer :all]
            [oph.soresu.form.formutil :as form-util])
  (:import [java.io File]))

(def person-names {:start ["Jorma" "Pertti" "Esko" "Anna" "Marjo" "Tiina"]
                   "Jorma" ["Karhu." "Vasara." "Männikäinen."]
                   "Pertti" ["Jorma" "Arinen." "Haahka."]
                   "Esko" ["Pertti" "Tiittanen." "Hollokainen."]
                   "Anna" ["Esko" "Helko." "Hyyppä."]
                   "Marjo" ["Tiina" "Dufva." "Haapasalmi." "Haapoja."]
                   "Tiina" ["Anna" "Vasara." "Kirves." "Ankkuri."]})

(def project-names {:start ["Virtaa" "Voimaa" "Räjähtävää" "Tuulta" "Rauhaa"]
                    "Virtaa" ["Tanssimalla" "Vasaroimalla." "Hirven"]
                    "Voimaa" ["Punttisalilta." "Tanssimalla" "Mäntymetsästä."]
                    "Tanssimalla" ["Hirven" "Taulun" "Pullon"]
                    "Hirven" ["Kanssa." "Mukana." "Tahtiin."]
                    "Räjähtävää" ["Voimaa" "Tuulta" "Virtaa"]
                    "Taulun" ["Äärellä." "Maalauksesta." "Maalaamisesta."]
                    "Rauhaa" ["Taulun" "Tuulta"]
                    "Tuulta" ["Purjeisiin." "Tanssimalla" "Hirven"]
                    "Pullon" ["Äärellä." "Pyörittämisellä." "Uusiokäytöstä."]})

(def organization-names {:start ["Lohjan" "Valtimon" "Rovaniemen" "Helsingin" "Rauman" "Tampereen"
                                 "Espoon" "Vantaan" "Pudasjärven" "Riihimäen" "Turun" "Raision"
                                 "Etelä" "Pohjois" "Itä" "Etelä"]
                         "Lohjan" ["Settlementti" "Koulutus"]
                         "Rovaniemen" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Rauman" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Tampereen" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Espoon" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Vantaan" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Pudasjärven" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Riihimäen" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Turun" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Raision" ["Valtimon" "Settlementti" "Koulutus" "Ja"]
                         "Valtimon" ["Settlementti" "Akatemia."]
                         "Settlementti" ["Yhdistys." "Oy."]
                         "Helsingin" ["Valtimon" "Koulutus"]
                         "Koulutus" ["Oy." "Järjestö." "Seura." "Ja"]
                         "Etelä" ["Lapin" "Kainuun" "Savon" "Uudenmaan" "Hämeen"]
                         "Pohjois" ["Lapin" "Kainuun" "Savon" "Uudenmaan" "Hämeen"]
                         "Itä" ["Lapin" "Kainuun" "Savon" "Uudenmaan" "Hämeen"]
                         "Länsi" ["Lapin" "Kainuun" "Savon" "Uudenmaan" "Hämeen"]
                         "Lapin" ["Konferenssi." "Akatemia." "Opisto." "Seura." "Settlementti"]
                         "Kainuun" ["Konferenssi." "Akatemia." "Opisto." "Seura." "Settlementti"]
                         "Savon" ["Konferenssi." "Akatemia." "Opisto." "Seura." "Settlementti"]
                         "Uudenmaan" ["Konferenssi." "Akatemia." "Opisto." "Seura." "Settlementti"]
                         "Hämeen" ["Konferenssi." "Akatemia." "Seura." "Settlementti"]
                         "Ja" ["Konferenssi." "Akatemia." "Seura."
                               "Rovaniemen" "Lohjan" "Rauman"
                               "Tampereen"
                               "Espoon"
                               "Savon"]})

(def random-text
  {:start ["Konsulin" "Frimanin" "Peruste" "Koko" "Suomen"
           ]
   "Konsulin" ["avuksi nimitetään varakonsuli Frimanilla oli apunaan suomenkielentaitoinen sihteeri Elsa Lantto."
               "tulee olla varakas ja tukevapohjainen liikemies."
               "Peruste"
               "Ja"]
   "Suomen" ["konsulille moinen käytös ei sotavuosina sopinut." "Konsulin" "Peruste"]
   "Konsuli" ["nimittäin halusi jakaa konsulinvirkaa rasittavat menot jonkun muun kanssa."]
   "Frimanin" ["Frimanin suosituksesta varakonsuliksi nimitettiin Otto Lesslie." "Konsulin"]
   "Ja" ["Frimanin" "Koko"
         "syynä oli se, että \"hallitus oli pitänyt olosuhteiden vaatimana järjestää edustus uudelleen\"."]
   "Peruste" ["oli raadollinen."]
   "Koko" ["Suomen ulkomaanedustushan nojasi vielä maailmansotien välillä konsuleihin, jotka tekivät työtä palkatta."
           "Peruste"]


   })

;; See: https://diegobasch.com/fun-with-markov-chains-and-clojure
(defn sentence [data]
  (loop [ws (data :start)
         acc []]
    (let [w (rand-nth ws)
          nws (data w)
          nacc (concat acc [w])]
      (if (= \. (last w))
        (clojure.string/join " " nacc)
        (recur nws nacc)))))

(defn generate-text [data field]
  (trace "field id" (:id field))
  (let [text (-> (sentence data)
                 (clojure.string/replace  #"\." ""))
        max-length (-> field :params :maxlength)]
    (if max-length
      (subs text 0 (min (count text) max-length))
      text)))

(defmulti generate-text-field :id)
(defmethod generate-text-field "organization" [field] (generate-text organization-names field))
(defmethod generate-text-field "applicant-name" [field] (generate-text person-names field))
(defmethod generate-text-field "signature" [field] (generate-text person-names field))
(defmethod generate-text-field "project-name" [field] (generate-text project-names field))
(defmethod generate-text-field "applicant-name" [field] (generate-text person-names field))
(defmethod generate-text-field "project-begin" [field] "1.1.2015")
(defmethod generate-text-field "project-end" [field] "15.8.2018")
(defmethod generate-text-field "project-www" [field] "http://www.wikipedia.org")
(defmethod generate-text-field :default [field]
  (cond
    (re-matches #".*organizations.*name.*" (:id field)) (generate-text organization-names field)
    (re-matches #".*row.*description" (:id field)) (generate-text organization-names field)
    :else (generate-text random-text field)))

(defmulti generate :fieldType)

(defmethod generate "textField" [field] (generate-text-field field))

(defmethod generate "emailField" [field] "foobar@example.org")
(defmethod generate "vaEmailNotification" [field] "foobar@example.org")
(defmethod generate "radioButton" [field] (:value (first (:options field))))
(defmethod generate "vaFocusAreas" [field] ["focus-area-0"])
(defmethod generate "checkboxButton" [field] [(:value (first (:options field)))])
(defmethod generate "textArea" [field] (generate-text random-text field))

(defmethod generate "moneyField" [field]
  (if (re-find #"income" (:id field))
    (str (rand-int 100))
    (str (+ 1000 (rand-int 120000)))))

(defmethod generate "finnishBusinessIdField" [field] "5278603-3")
(defmethod generate "iban" [field] "FI21 1234 5600 0007 85")
(defmethod generate "bic" [field] "TESTBANK")


(defmethod generate :default [field]
  (trace "unknown fieldtype" field)
  (assert false))

(defn handle-attachment [hakemus-id hakemus-version field]
  (if (= (:fieldType field) "namedAttachment")
    (let [file (File. "test-data/test.png")]
      (create-attachment hakemus-id hakemus-version (:id field) "test.png" "image/png" (.length file) (.getAbsoluteFile file))
      false)
    true))

(defn update-form-submission [form-id values-id answers]
  (if (not (submission-exists? form-id values-id))
    (throw (Exception. "Submission not found"))
    (update-submission! form-id values-id answers)))

(defn generate-data [avustushaku amount]
  (let [avustushaku-id (:id avustushaku)
        form-id (:form avustushaku)
        attachments []
        form (get-form form-id)]
    (trace "Processing avustushaku" (-> avustushaku :content :name :fi))
    (doseq [x (range 0 amount)]
      (trace "Generating hakemus" x)
      (let [hakemus (->> (create-hakemus! avustushaku-id form-id {})
                         :hakemus)
            submission-id (:form_submission_id hakemus)
            answers (form-util/generate-answers form
                                                generate
                                                (partial handle-attachment (:id hakemus) (:version hakemus)))
            saved-submission (update-form-submission form-id submission-id answers)
            validation (validation/validate-form form answers (get-attachments (:user_key hakemus) (:id hakemus)))
            submission-version (:version saved-submission)]
        (when (not (every? empty? (vals validation)))
          (trace "Validation failed" validation)
          (trace "Answers" answers)
          (System/exit 1))
        (submit-hakemus avustushaku-id
                        (:user_key hakemus)
                        submission-id
                        submission-version
                        (:register_number hakemus)
                        answers)))))

(defn -main [& args]
  (let [avustushaut (->> (list-avustushaut)
                         (filter (fn [haku] (= (:status haku) "published"))))]
    (doseq [avustushaku avustushaut]
      (generate-data avustushaku (->> (first args)
                                    (Long/parseLong))))))
