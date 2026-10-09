(ns oph.va.virkailija.search-data
  (:require [clojure.string :as string]
            [clojure.tools.logging :as log]
            [oph.soresu.common.db :refer [escape-like-pattern query-original-identifiers]]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]))

(def ^:private max-search-terms 20)
(def ^:private max-search-words 10)

(defn- distinct-ignoring-case [strings]
  (->> strings
       (reduce (fn [[seen result] s]
                 (let [k (string/lower-case s)]
                   (if (seen k) [seen result] [(conj seen k) (conj result s)])))
               [#{} []])
       second))

(defn- split-search-terms
  "\"helsingin kaupunki, Vantaa\" => [\"helsingin kaupunki\" \"Vantaa\"]"
  [search]
  (->> (string/split search #",")
       (map string/trim)
       (remove empty?)
       distinct-ignoring-case
       (take max-search-terms)))

(defn- split-search-words [term]
  (->> (string/split (string/lower-case term) #"\s+")
       (remove empty?)
       distinct
       (take max-search-words)))

(defn- word-start-regex [word]
  (str "(^|[^[:alnum:]])" (string/replace word #"[^\p{L}\p{N}]" #(str "\\" %))))

(defn- word-start-condition
  "SQL where every word of the term starts a word in some of the columns.
   Columns are pasted into the SQL, so they must be constants, never user input."
  [columns term]
  (let [words (split-search-words term)
        word-in-any-column (str "(" (string/join
                                     " OR "
                                     (map #(str "LOWER(" % ") ~ ?") columns))
                                ")")]
    {:sql (str "(" (string/join " AND " (repeat (count words) word-in-any-column)) ")")
     :params (for [word words
                   _ columns]
               (word-start-regex word))}))

(defn- term-column [i]
  (str "term_" i))

(defn- term-match-sql
  "Returns SQL select-list additions (one boolean column term_N per search term),
   a WHERE condition matching any term, and the bound parameters for the select-list.
   A term matches when it is a substring of the register number or when every
   word in it matches the start of a word in some of the given columns."
  [register-number-column columns terms]
  (let [conditions (for [term terms
                         :let [{:keys [sql params]} (word-start-condition columns term)
                               register-number-pattern (str "%" (escape-like-pattern (string/lower-case term)) "%")]]
                     {:sql (str "(" register-number-column " LIKE ? OR " sql ")")
                      :params (cons register-number-pattern params)})]
    {:select (string/join
              ", "
              (map-indexed (fn [i {:keys [sql]}] (str sql " AS " (term-column i))) conditions))
     :where (string/join " OR " (map-indexed (fn [i _] (term-column i)) conditions))
     :params (mapcat :params conditions)}))

(defn- with-matched-terms
  "Replaces the term_N columns of a row with :matched-terms, the terms that matched"
  [terms row]
  (let [term-keys (map #(keyword (str "term-" %)) (range (count terms)))] ; term_N after convert-to-dash-keys
    (assoc (apply dissoc row term-keys)
           :matched-terms (vec (for [[term term-key] (map vector terms term-keys)
                                     :when (get row term-key)]
                                 term)))))

(defn- highlight-parts
  "Splits the text into consecutive parts, marking the word starts that the matched terms
   matched: \"Vantaan kaupunki\" with [\"vantaa\"] =>
   [{:text \"Vantaa\" :match true} {:text \"n kaupunki\" :match false}]"
  [text matched-terms]
  (let [words (->> matched-terms (mapcat split-search-words) distinct (sort-by count >))]
    (cond
      (empty? text) []
      (empty? words) [{:text text :match false}]
      :else
      (let [alternatives (string/join "|" (map #(java.util.regex.Pattern/quote %) words))
            matcher (re-matcher (re-pattern (str "(?iu)(?<![\\p{L}\\p{N}])(" alternatives ")")) text)
            match-bounds (loop [bounds []]
                           (if (.find matcher)
                             (recur (conj bounds (.start matcher) (.end matcher)))
                             bounds))]
        ;; bounds alternate between the starts of non-matching and matching parts
        (->> (partition 2 1 (concat [0] match-bounds [(count text)]))
             (map-indexed (fn [i [start end]]
                            {:text (subs text start end) :match (odd? i)}))
             (remove #(empty? (:text %)))
             vec)))))

(defn- order-direction [order]
  (if (= order "created-at-asc") "ASC" "DESC"))

(defn- find-applications [terms order]
  (let [{:keys [select where params]} (term-match-sql "h.register_number" ["h.organization_name" "h.project_name"] terms)
        sql (str "SELECT * FROM (
                    SELECT
                      h.id, h.created_at, h.version, h.budget_total, h.budget_oph_share,
                      h.organization_name, h.project_name, h.register_number, h.parent_id,
                      h.language, h.avustushaku AS grant_id, h.refused, h.refused_comment,
                      h.refused_at, a.content#>'{name, fi}' AS grant_name,
                      CASE WHEN ar.id IS NOT NULL THEN jsonb_build_object(
                        'status', ar.status,
                        'budget-granted', ar.budget_granted,
                        'rahoitusalue', ar.rahoitusalue,
                        'talousarviotili', ar.talousarviotili,
                        'should-pay', ar.should_pay,
                        'should-pay-comments', ar.should_pay_comments) END AS evaluation, "
                 select "
                    FROM hakija.hakemukset h
                    LEFT JOIN hakija.avustushaut a ON a.id = h.avustushaku
                    LEFT JOIN virkailija.arviot ar ON ar.hakemus_id = h.id
                    WHERE h.version_closed IS NULL
                      AND h.hakemus_type = 'hakemus') matches
                  WHERE " where "
                  ORDER BY created_at " (order-direction order))]
    (mapv #(->> % convert-to-dash-keys (with-matched-terms terms))
          (query-original-identifiers sql params))))

(defn- find-grants [terms order]
  (let [{:keys [select where params]} (term-match-sql "register_number" ["content#>>'{name,fi}'"] terms)]
    (mapv #(->> % convert-to-dash-keys (with-matched-terms terms))
          (query-original-identifiers
           (str "SELECT * FROM (
                   SELECT id, created_at, form, content, status, register_number, valiselvitysdate,
                          loppuselvitysdate, form_loppuselvitys, form_valiselvitys,
                          is_academysize, haku_type, allow_visibility_in_external_system,
                          arvioitu_maksupaiva, loppuselvitys_otantatarkastus_enabled, "
                select "
                   FROM hakija.avustushaut) matches
                 WHERE " where "
                 ORDER BY created_at " (order-direction order))
           params))))

(defn- shorten-word
  "Drops the last two letters, keeping at least three, so that
   \"lahti\" also finds \"Lahden\" and \"turku\" finds \"Turun\""
  [word]
  (if (<= (count word) 3)
    word
    (subs word 0 (max 3 (- (count word) 2)))))

(defn- find-application-suggestions
  "Organization names matching the term with each word shortened"
  [term]
  (let [shortened (->> (split-search-words term)
                       (map shorten-word)
                       (string/join " "))
        {:keys [sql params]} (word-start-condition ["organization_name"] shortened)]
    (if (empty? shortened)
      []
      (map convert-to-dash-keys
           (query-original-identifiers
            (str "SELECT organization_name, COUNT(*) AS application_count
                  FROM hakija.hakemukset
                  WHERE version_closed IS NULL
                    AND hakemus_type = 'hakemus'
                    AND " sql "
                  GROUP BY organization_name
                  ORDER BY application_count DESC, organization_name
                  LIMIT 5")
            params)))))

(defn- highlight [row text parts-key]
  (assoc row parts-key (highlight-parts text (:matched-terms row))))

(defn- term-result [term rows]
  (let [hit-count (count (filter #(some #{term} (:matched-terms %)) rows))]
    {:term term
     :hit-count hit-count
     ;; Suggestions are optional, so a failure there must not fail the search
     :suggestions (if (zero? hit-count)
                    (try
                      (vec (find-application-suggestions term))
                      (catch Exception e
                        (log/warn e "Finding suggestions failed for" term)
                        []))
                    [])}))

(defn search [search order]
  (let [terms (split-search-terms search)
        hakemukset (if (seq terms) (find-applications terms order) [])
        avustushaut (if (seq terms) (find-grants terms order) [])
        rows (concat hakemukset avustushaut)]
    {:terms (mapv #(term-result % rows) terms)
     :hakemukset (for [hakemus hakemukset]
                   (-> hakemus
                       (highlight (:organization-name hakemus) :organization-name-parts)
                       (highlight (:project-name hakemus) :project-name-parts)
                       (dissoc :matched-terms)))
     :avustushaut (for [haku avustushaut]
                    (-> haku
                        (highlight (get-in haku [:content :name :fi]) :name-parts)
                        (dissoc :matched-terms)))}))
