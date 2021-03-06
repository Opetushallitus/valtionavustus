(ns oph.va.virkailija.db
  (:use [oph.soresu.common.db]
        [oph.va.menoluokka.db]
        [clojure.data :as data]
        [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.form.formutil :as formutil]
            [oph.va.virkailija.db.queries :as queries]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :as hakija-api]
            [clojure.string :as string]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [oph.va.budget :as va-budget])
  (:import [java.util Date]))

(defn- add-paatos-menoluokkas [tx paatos-id avustushaku-id talousarvio]
  (doseq [[type amount] (seq talousarvio)]
    (log/info (str "INSERTING EINFWIROGMW " (name type) " " amount " " paatos-id))
    (execute! tx
      "INSERT INTO menoluokka_paatos (menoluokka_id, paatos_id, amount)
       VALUES ((SELECT id FROM menoluokka WHERE avustushaku_id = ? AND type = ?), ?, ?)"
      [avustushaku-id (name type) paatos-id amount])))

(defn- get-talousarvio [id entity]
  (query (str "SELECT mh.amount, m.type, m.translation_fi, m.translation_sv
               FROM virkailija.menoluokka_" entity " as mh, virkailija.menoluokka as m
               WHERE m.id = mh.menoluokka_id AND mh." entity "_id = ?")
         [id]))

(defn- store-muutoshakemus-paatos [muutoshakemus-id paatos decider avustushaku-id]
  (with-tx (fn [tx]
    (let [created-paatos (first (query tx
            "INSERT INTO virkailija.paatos (status, user_key, reason, decider, paattymispaiva)
             VALUES (?::virkailija.paatos_type, ?, ?, ?, ?)
             RETURNING id, status, reason, decider, user_key, to_char(paattymispaiva, 'YYYY-MM-DD') as paatos_hyvaksytty_paattymispaiva, created_at, updated_at"
            [(:status paatos) (generate-hash-id) (:reason paatos) decider (:paattymispaiva paatos)]))]
      (execute! tx
                "UPDATE virkailija.muutoshakemus
                SET paatos_id = ?
                WHERE id = ?" [(:id created-paatos) muutoshakemus-id])
      (when (:talousarvio paatos)
        (add-paatos-menoluokkas tx (:id created-paatos) avustushaku-id (:talousarvio paatos)))
      created-paatos))))

(defn create-muutoshakemus-paatos [muutoshakemus-id paatos decider avustushaku-id]
  (if-let [created-paatos (store-muutoshakemus-paatos muutoshakemus-id paatos decider avustushaku-id)]
    (assoc created-paatos :talousarvio (get-talousarvio (:id created-paatos) "paatos"))))

(defn get-menoluokkas [avustushaku-id]
  (query "SELECT type, translation_fi, translation_sv FROM virkailija.menoluokka WHERE avustushaku_id = ?" [avustushaku-id]))

(defn get-normalized-hakemus [hakemus-id]
  (log/info (str "Get normalized hakemus with id: " hakemus-id))
  (let [hakemukset (query "SELECT
                            h.id,
                            h.hakemus_id,
                            h.contact_person,
                            h.contact_email,
                            h.contact_phone,
                            h.project_name,
                            h.created_at,
                            h.updated_at,
                            h.organization_name,
                            h.register_number
                          FROM
                            virkailija.normalized_hakemus h
                          WHERE h.hakemus_id = ?" [hakemus-id])
        hakemus (first hakemukset)
        talousarvio (get-talousarvio hakemus-id "hakemus")]
    (log/info (str "Succesfully fetched hakemus with id: " hakemus-id))
    (if hakemus
      (assoc hakemus :talousarvio talousarvio)
      nil)))

(defn has-multiple-menoluokka-rows [hakemus-id]
  (let [result (first (query "SELECT COUNT(id) FROM menoluokka_hakemus WHERE hakemus_id = ?" [hakemus-id]))]
    (> (:count result) 1)))

(defn is-avustushaku-muutoshakukelpoinen? [avustushaku-id]
  (if-some [row (first (query "SELECT muutoshakukelpoinen FROM avustushaut WHERE id = ?" [avustushaku-id]))]
    (:muutoshakukelpoinen row)))

(defn get-normalized-hakemus-contact-email [hakemus-id]
  (:contact-email (get-normalized-hakemus hakemus-id)))

(defn- get-talousarvio [id entity]
  (query (str "SELECT mh.amount, m.type, m.translation_fi, m.translation_sv
               FROM virkailija.menoluokka_" entity " as mh, virkailija.menoluokka as m
               WHERE m.id = mh.menoluokka_id AND mh." entity "_id = ?")
         [id]))

(defn get-muutoshakemukset [hakemus-id]
  (log/info (str "Get muutoshakemus with hakemus id: " hakemus-id))
  (let [basic-muutoshakemukset (query
                            "SELECT
                                m.id,
                                m.hakemus_id,
                                (CASE
                                  WHEN paatos_id IS NULL
                                  THEN 'new'
                                  ELSE p.status::text
                                END) as status,
                                haen_kayttoajan_pidennysta,
                                kayttoajan_pidennys_perustelut,
                                haen_sisaltomuutosta,
                                sisaltomuutos_perustelut,
                                m.created_at,
                                to_char(haettu_kayttoajan_paattymispaiva, 'YYYY-MM-DD') as haettu_kayttoajan_paattymispaiva,
                                talousarvio_perustelut,
                                p.id as paatos_id,
                                p.user_key as paatos_user_key,
                                p.created_at as paatos_created_at,
                                to_char(p.paattymispaiva, 'YYYY-MM-DD') as paatos_hyvaksytty_paattymispaiva,
                                ee.created_at as paatos_sent_at
                              FROM virkailija.muutoshakemus m
                              LEFT JOIN virkailija.paatos p ON m.paatos_id = p.id
                              LEFT JOIN virkailija.email_event ee
                                ON ee.id = (SELECT max(id) FROM virkailija.email_event WHERE muutoshakemus_id = m.id AND email_type = 'muutoshakemus-paatos' AND success = true)
                              WHERE m.hakemus_id = ?
                              ORDER BY id DESC" [hakemus-id])
        muutoshakemukset-talousarvio (map #(assoc % :talousarvio (get-talousarvio (:id %) "muutoshakemus")) basic-muutoshakemukset)
        muutoshakemukset-paatos-talousarvio (map #(assoc % :paatos-talousarvio (get-talousarvio (:paatos-id %) "paatos")) muutoshakemukset-talousarvio)
        muutoshakemukset (map #(dissoc % :paatos-id) muutoshakemukset-paatos-talousarvio)]
    (log/info (str "Succesfully fetched muutoshakemukset with id: " hakemus-id))
    muutoshakemukset))

(defn get-arviot [hakemus-ids]
  (if (empty? hakemus-ids)
    []
    (exec queries/get-arviot {:hakemus_ids hakemus-ids})))

(defn get-hakemukset-without-valmistelija [hakemus-ids]
  (map :id (exec queries/get-hakemukset-without-valmistelija {:hakemus_ids hakemus-ids})))

(defn list-arvio-status-and-budget-granted-by-hakemus-ids [hakemus-ids]
  (if (empty? hakemus-ids)
    []
    (exec queries/list-arvio-status-and-budget-granted-by-hakemus-ids {:hakemus_ids hakemus-ids})))

(defn get-arvio [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec queries/get-arvio)
       first))

(defn- ->changelog-entry [identity type timestamp data]
  {:type type
   :timestamp timestamp
   :data data
   :person-oid (:person-oid identity)
   :username (:username identity)
   :first-name (:first-name identity)
   :last-name (:surname identity)
   :email (:email identity)})

(defn- append-changelog [changelog entry]
  (cons entry changelog))

(defn- compare-summary-comment [changelog identity timestamp existing new]
  (let [old-comment (:summary_comment existing)
        new-comment (:summary_comment new)]
    (if (not (= old-comment new-comment))
      (append-changelog changelog (->changelog-entry identity
                                                     "summary-comment"
                                                     timestamp
                                                     {:old old-comment
                                                      :new new-comment}))
      changelog)))

(defn- compare-presenter-comment [changelog identity timestamp existing new]
  (let [old-comment (:presentercomment existing)
        new-comment (:presentercomment new)]
    (if (not (= old-comment new-comment))
      (append-changelog changelog (->changelog-entry identity
                                                     "presenter-comment"
                                                     timestamp
                                                     {:old old-comment
                                                      :new new-comment}))
      changelog)))

(defn- compare-oppilaitokset [changelog identity timestamp existing new]
  (let [new-oppilaitokset (:oppilaitokset new)
        existing-oppilaitokset (:oppilaitokset existing)]
    (if (not (= new-oppilaitokset existing-oppilaitokset))
      (append-changelog changelog (->changelog-entry identity
                                                     "oppilaitokset-change"
                                                     timestamp
                                                     {:old existing-oppilaitokset
                                                      :new new-oppilaitokset}))
      changelog)))

(defn- compare-budget-granted [changelog identity timestamp existing new]
  (let [new-budget (:budget_granted new)
        existing-budget (:budget_granted existing)]
    (if (not (= new-budget existing-budget))
      (append-changelog changelog (->changelog-entry identity
                                                     "budget-change"
                                                     timestamp
                                                     {:old existing-budget
                                                      :new new-budget}))
      changelog)))

(defn- compare-overridden-answers [changelog identity timestamp existing new]
  (let [new-answers (formutil/unwrap-answers (:value (:overridden_answers new)) [])
        existing-answers (formutil/unwrap-answers (:value (:overridden_answers existing)) [])
        diff-answers (data/diff new-answers existing-answers)
        added-answers (first diff-answers)
        removed-answers (second diff-answers)]
    (if (some some? [added-answers removed-answers])
      (append-changelog changelog (->changelog-entry identity
                                                     "overridden-answers-change"
                                                     timestamp
                                                     {:old removed-answers
                                                      :new added-answers}))
      changelog)))

(defn- compare-status [changelog identity timestamp existing new]
  (if (not (= (:status new) (keyword (:status existing))))
    (append-changelog changelog (->changelog-entry identity
                                                   "status-change"
                                                   timestamp
                                                   {:old (:status existing)
                                                    :new (:status new)}))
    changelog))

(defn- compare-allow-visibility-in-external-system [changelog identity timestamp existing new]
  (if (not (= (:allow_visibility_in_external_system new) (:allow_visibility_in_external_system existing)))
    (append-changelog changelog (->changelog-entry identity
                                                   "allow-visibility-in-external-system-change"
                                                   timestamp
                                                   {:old (:allow_visibility_in_external_system existing)
                                                    :new (:allow_visibility_in_external_system new)}))
    changelog))

(defn- compare-should-pay [changelog identity timestamp existing new]
  (if (not (= (:should_pay new) (:should_pay existing)))
    (append-changelog changelog (->changelog-entry identity
                                                   "should-pay-change"
                                                   timestamp
                                                   {:old (:should_pay existing)
                                                    :new (:should_pay new)}))
    changelog))

(defn- update-changelog [identity existing new]
  (let [changelog (:changelog existing)
        timestamp (Date.)]
    (if identity
      (-> (if changelog changelog [])
          (compare-status identity timestamp existing new)
          (compare-oppilaitokset identity timestamp existing new)
          (compare-should-pay identity timestamp existing new)
          (compare-budget-granted identity timestamp existing new)
          (compare-summary-comment identity timestamp existing new)
          (compare-presenter-comment identity timestamp existing new)
          (compare-overridden-answers identity timestamp existing new))
      changelog)))

(defn- calculate-total-oph-budget [avustushaku hakemus-id status arvio]
  (cond
    (= status :rejected) 0
    (not (:overridden-answers arvio)) (:budget-granted arvio)
    :else (let [form (hakija-api/get-form-by-avustushaku (:id avustushaku))
                hakemus (hakija-api/get-hakemus hakemus-id)
                calculated-budget (va-budget/calculate-totals-virkailija (:overridden-answers arvio)
                                                                         avustushaku
                                                                         form
                                                                         hakemus
                                                                         (:useDetailedCosts arvio)
                                                                         (:costsGranted arvio))]
            (:oph-share calculated-budget))))

(defn delete-menoluokka-hakemus-rows [hakemus-id]
  (execute! "DELETE FROM virkailija.menoluokka_hakemus WHERE hakemus_id = ?" [hakemus-id]))

(defn update-or-create-hakemus-arvio [avustushaku hakemus-id arvio identity]
  (let [status (keyword (:status arvio))
        costs-granted (:costsGranted arvio)
        use-detailed-costs (:useDetailedCosts arvio)
        budget-granted (or (calculate-total-oph-budget avustushaku hakemus-id status arvio) 0)
        academysize (or (:academysize arvio) 0)
        overridden-answers (:overridden-answers arvio)
        oppilaitokset-names (filter not-empty (:names (:oppilaitokset arvio)))
        allow-visibility-in-external-system (or (:allow-visibility-in-external-system arvio) false)
        arvio-to-save  {:hakemus_id hakemus-id
                        :status status
                        :overridden_answers overridden-answers
                        :seuranta_answers (:seuranta-answers arvio)
                        :budget_granted budget-granted
                        :costs_granted costs-granted
                        :use_overridden_detailed_costs use-detailed-costs
                        :summary_comment (:summary-comment arvio)
                        :presentercomment (:presentercomment arvio)
                        :roles (:roles arvio)
                        :presenter_role_id (:presenter-role-id arvio)
                        :rahoitusalue (:rahoitusalue arvio)
                        :talousarviotili (:talousarviotili arvio)
                        :academysize academysize
                        :perustelut (:perustelut arvio)
                        :tags (:tags arvio)
                        :oppilaitokset {:names oppilaitokset-names}
                        :allow_visibility_in_external_system allow-visibility-in-external-system
                        :should_pay (:should-pay arvio)
                        :should_pay_comments (:should-pay-comments arvio)}
        existing (get-arvio hakemus-id)
        changelog (update-changelog identity existing arvio-to-save)
        arvio-with-changelog (assoc arvio-to-save :changelog [changelog])]

    (if use-detailed-costs
      (store-menoluokka-hakemus-rows (:id avustushaku) hakemus-id overridden-answers)
      (delete-menoluokka-hakemus-rows hakemus-id))
    (if existing
      (exec queries/update-arvio<! arvio-with-changelog)
      (exec queries/create-arvio<! arvio-with-changelog))))

(defn health-check []
  (->> {}
       (exec queries/health-check)
       first
       :?column?
       (= 1)))

(defn get-or-create-arvio [hakemus-id]
  (if-let [arvio (get-arvio hakemus-id)]
    arvio
    (exec queries/create-empty-arvio<! {:hakemus_id hakemus-id})))

(defn list-comments [hakemus-id]
  (let [arvio-id (:id (get-or-create-arvio hakemus-id))]
    (exec queries/list-comments {:arvio_id arvio-id})))

(defn add-comment [hakemus-id first-name last-name email comment person-oid]
  (let [arvio-id (:id (get-or-create-arvio hakemus-id))]
    (when (exec queries/create-comment<!
                {:arvio_id arvio-id
                 :first_name first-name
                 :last_name last-name
                 :email email
                 :comment comment
                 :person_oid person-oid})
      (list-comments hakemus-id))))

(defn score->map [score]
  {:arvio-id (:arvio_id score)
   :person-oid (:person_oid score)
   :first-name (:first_name score)
   :last-name (:last_name score)
   :email (:email score)
   :selection-criteria-index (:selection_criteria_index score)
   :score (:score score)
   :created-at (:created_at score)
   :modified-at (:modified_at score)})

(defn list-scores [arvio-id]
  (->> (exec queries/list-scores {:arvio_id arvio-id})
       (map score->map)))

(defn list-avustushaku-scores [avustushaku-id]
  (->> (exec queries/list-avustushaku-scores {:avustushaku_id avustushaku-id})
       (map score->map)))

(defn- update-or-create-score [avustushaku-id arvio-id identity selection-criteria-index score]
  (let [params {:avustushaku_id           avustushaku-id
                :arvio_id                 arvio-id
                :person_oid               (:person-oid identity)
                :first_name               (:first-name identity)
                :last_name                (:surname identity)
                :email                    (:email identity)
                :selection_criteria_index selection-criteria-index
                :score                    score}]
    (if-let [updated (exec queries/update-score<! params)]
      updated
      (exec queries/create-score<! params))))

(defn delete-score [arvio-id selection-criteria-index identity]
  (exec queries/delete-score!
        {:arvio_id  arvio-id
         :person_oid (:person-oid identity)
         :selection_criteria_index selection-criteria-index}))

(defn add-score [avustushaku-id arvio-id identity selection-criteria-index score]
  (update-or-create-score avustushaku-id arvio-id identity selection-criteria-index score))

(defn find-search [avustushaku-id query]
  (->> {:avustushaku_id avustushaku-id :query query}
       (exec queries/find-search)
       first))

(defn create-search! [avustushaku-id query name person-oid]
  (exec queries/create-search<! {:avustushaku_id avustushaku-id
                                                :query query
                                                :name name
                                                :oid person-oid}))

(defn get-search [avustushaku-id saved-search-id]
  (->> {:avustushaku_id avustushaku-id :id saved-search-id}
       (exec queries/get-search)
       first))

(defn get-finalized-hakemus-ids
  "Filters hakemus-ids so that only 'accepted' and 'rejected' are included (this status is in arviot)"
  [hakemus-ids]
  (if (empty? hakemus-ids)
    []
    (->> {:hakemus_ids (vec hakemus-ids)}
         (exec queries/get-accepted-or-rejected-hakemus-ids)
         (map :hakemus_id))))

(defn get-accepted-hakemus-ids [hakemus-ids]
  (if (empty? hakemus-ids)
    []
    (->> {:hakemus_ids (vec hakemus-ids)}
         (exec queries/get-accepted-hakemus-ids)
         (map :hakemus_id))))

(defn- va-user->db [va-user]
  {:person_oid (:person-oid va-user)
   :first_name (:first-name va-user)
   :surname    (:surname va-user)
   :email      (:email va-user)
   :content    {:lang       (:lang va-user)
                :privileges (:privileges va-user)}})

(defn- db->va-user [db]
  {:person-oid (:person_oid db)
   :first-name (:first_name db)
   :surname    (:surname db)
   :email      (:email db)
   :lang       (-> db :content :lang)
   :privileges (-> db :content :privileges)})

(defn update-va-users-cache [va-users]
  (with-transaction connection
                    (let [db-options {:connection connection}]
                      (queries/lock-va-users-cache-exclusively! {} db-options)
                      (doseq [user va-users]
                        (let [db-user     (va-user->db user)
                              num-updated (queries/update-va-user-cache! db-user db-options)]
                          (when (< num-updated 1)
                            (queries/create-va-user-cache<! db-user db-options))))
                      (let [person-oids (into [] (map :person-oid va-users))]
                        (if (seq person-oids)
                          (queries/delete-va-user-cache-by-not-in! {:person_oids person-oids} db-options)
                          (queries/delete-va-user-cache! {} db-options))))))

(defn get-va-user-cache-by-person-oid [person-oid]
  (->> {:person_oid person-oid}
       (exec queries/get-va-user-cache-by-person-oid)
       (map db->va-user)
       first))

(def ^:private va-users-cache-columns-to-search ["first_name" "surname" "email"])

(defn search-va-users-cache-by-terms [terms]
  (let [like-exprs-for-each-term     (->> va-users-cache-columns-to-search
                                          (map #(str % " ilike ?"))
                                          (string/join " or "))
        num-terms                    (count terms)
        like-exprs-for-all-terms     (str "(" (string/join ") and (" (repeat num-terms like-exprs-for-each-term)) ")")
        escaped-terms                (map #(str "%" (escape-like-pattern %) "%") terms)
        num-columns-to-search        (count va-users-cache-columns-to-search)
        escaped-terms-for-like-exprs (mapcat #(repeat num-columns-to-search %) escaped-terms)]
    (with-transaction connection
                      (jdbc/query connection
                                  (cons (string/join " "
                                                     ["select person_oid, first_name, surname, email, content"
                                                      "from va_users_cache"
                                                      "where" like-exprs-for-all-terms
                                                      "order by first_name, surname, email"])
                                        escaped-terms-for-like-exprs)
                                  {:row-fn db->va-user}))))

(defn create-application-token [application-id]
  (let [existing-token
        (first (exec hakija-queries/get-application-token
                     {:application_id application-id}))]

    (if (some? existing-token)
      {:token (:token existing-token)}
      (first
       (exec hakija-queries/create-application-token
             {:application_id application-id :token (generate-hash-id)})))))

(defn- budget->menoluokka [budget-elem]
  {:type (:id budget-elem)
   :translation_fi (:fi (:label budget-elem))
   :translation_sv (:sv (:label budget-elem))})

(defn- form->menoluokka [form]
  (let [content         (:content form)
        plan            (if content (first (filter #(when (= (:id %) "financing-plan") %) content)))
        budget          (if (:children plan) (first (filter #(when (= (:id %) "budget") %) (:children plan))))
        project-budget  (if (:children budget) (first (filter #(when (= (:id %) "project-budget") %) (:children budget))))
        menoluokka-rows (if (:children project-budget) (map budget->menoluokka (:children project-budget)))]
    menoluokka-rows))

(defn- upsert-menoluokka [tx application-id menoluokka]
  (let [id-rows (query tx
              "INSERT INTO virkailija.menoluokka (avustushaku_id, type, translation_fi, translation_sv)
              VALUES (?, ?, ?, ?)
              ON CONFLICT (avustushaku_id, type) DO UPDATE SET
                translation_fi = EXCLUDED.translation_fi,
                translation_sv = EXCLUDED.translation_sv
              RETURNING id"
              [application-id (:type menoluokka) (:translation_fi menoluokka) (:translation_sv menoluokka)])]
    (:id (first id-rows))))

(defn- parameter-list [list]
  (clojure.string/join ", " (take (count list) (repeat "?"))))

(defn- remove-old-menoluokka-rows [tx application-id current-menoluokka-ids]
  (execute! tx
    (str "DELETE FROM virkailija.menoluokka WHERE avustushaku_id = ? AND id NOT IN (" (parameter-list current-menoluokka-ids) ")")
    (conj current-menoluokka-ids application-id)))

(defn upsert-menoluokka-rows [application-id form]
  (if-let [menoluokka-rows (form->menoluokka form)]
    (with-tx (fn [tx]
      (let [current-menoluokka-ids (map (partial upsert-menoluokka tx application-id) menoluokka-rows)]
        (remove-old-menoluokka-rows tx application-id current-menoluokka-ids))))))

(defn copy-menoluokka-rows [tx from-application-id to-application-id]
  (execute! tx
            "INSERT INTO virkailija.menoluokka (avustushaku_id, type, translation_fi, translation_sv)
            SELECT ?, type, translation_fi, translation_sv
            FROM virkailija.menoluokka
            WHERE avustushaku_id = ?"
            [to-application-id from-application-id]))
