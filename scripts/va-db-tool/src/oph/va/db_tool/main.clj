(ns oph.va.db-tool.main
  (:require [clojure.string :as string]
            [oph.soresu.common.db :as db]
            [oph.soresu.form.formutil :as form-util]
            [oph.va.db-tool.queries :as queries])
  (:gen-class))

(defn- print-usage-and-exit
  ([]
   (print-usage-and-exit 0))

  ([exit-code]
   (println (string/join "\n"
                         '("Usage:"
                           ""
                           "  set-submitted-hakemukset-project-name-from-answer-key avustushaku-id answer-key")))
   (System/exit exit-code)))

(defn- parse-int-or-print-usage-and-exit [x]
  (try
    (Integer/parseInt x)
    (catch NumberFormatException _ (print-usage-and-exit 1))))

(defn- parse-nonempty-str-or-print-usage-and-exit [x]
  (if (and (string? x) (seq x))
    x
    (print-usage-and-exit 1)))

(defn- set-submitted-hakemukset-project-name-from-answer-key [avustushaku-id answer-key]
  {:pre [(integer? avustushaku-id) (seq answer-key)]}
  (doseq [hakemus (db/exec :form-db
                           queries/list-submitted-hakemus-answers-by-avustushaku-id
                           {:avustushaku_id avustushaku-id})]
    (let [hakemus-id (:id hakemus)
          hakemus-version (:version hakemus)
          proj-name-from-answer (form-util/find-answer-value (:answers hakemus) answer-key)]
      (when proj-name-from-answer
        (printf "hakemus_id=%d, hakemus_version=%d proj-name=\"%s\"\n" hakemus-id hakemus-version proj-name-from-answer)
        (db/exec :form-db
                 queries/update-hakemus-project-name!
                 {:hakemus_id hakemus-id :hakemus_version hakemus-version :project_name proj-name-from-answer})))))

(defn -main [& args]
  (condp = (first args)
    "set-submitted-hakemukset-project-name-from-answer-key"
    (let [avustushaku-id (parse-int-or-print-usage-and-exit (second args))
          answer-key (parse-nonempty-str-or-print-usage-and-exit (nth args 2))]
      (set-submitted-hakemukset-project-name-from-answer-key avustushaku-id answer-key))

    (print-usage-and-exit)))
