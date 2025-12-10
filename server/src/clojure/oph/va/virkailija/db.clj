(ns oph.va.virkailija.db
  (:require [oph.soresu.form.formutil :as formutil]
            [oph.va.virkailija.db.queries :as queries]
            [oph.soresu.common.db :refer [escape-like-pattern exec execute! generate-hash-id query with-transaction with-tx]]
            [clojure.data :as data]
            [oph.va.hakemus.db :as hakemus-copy]
            [oph.va.menoluokka.db :refer [store-menoluokka-hakemus-rows]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :as hakija-api]
            [clojure.string :as string]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [oph.va.budget :as va-budget])
  (:import [java.util Date]))

(defn- add-paatos-menoluokkas [tx paatos-id avustushaku-id talousarvio]
  (doseq [[type amount] (seq talousarvio)]
    (execute! tx
              "INSERT INTO menoluokka_paatos (menoluokka_id, paatos_id, amount)
       VALUES ((SELECT id FROM menoluokka WHERE avustushaku_id = ? AND type = ?), ?, ?)"
              [avustushaku-id (name type) paatos-id amount])))

(defn- get-talousarvio [id entity]
  (query (str "SELECT mh.amount, m.type, m.translation_fi, m.translation_sv
               FROM virkailija.menoluokka_" entity " as mh, virkailija.menoluokka as m
               WHERE m.id = mh.menoluokka_id AND mh." entity "_id = ?")
         [id]))

(defn- store-paatos-sisaltomuutos [tx paatos-id status]
  (execute! tx "insert into paatos_sisaltomuutos (paatos_id, status) values (?, ?::virkailija.paatos_type)"
            [paatos-id status]))

(defn- get-sisaltomuutos-paatos-status [id]
  (let [rows (query "SELECT status FROM paatos_sisaltomuutos WHERE paatos_id = ?" [id])]
    (:status (first rows))))

(defn store-paatos-jatkoaika [tx paatos-id status paattymispaiva]
  (execute! tx "INSERT INTO paatos_jatkoaika (paatos_id, status, paattymispaiva)
                VALUES (?, ?::virkailija.paatos_type, ?)"
            [paatos-id status paattymispaiva]))

(defn store-paatos-talousarvio [tx paatos-id status]
  (execute! tx "INSERT INTO paatos_talousarvio (paatos_id, status)
                VALUES (?, ?::virkailija.paatos_type)"
            [paatos-id status]))

(defn muutoshakemus-has-talousarvio? [tx muutoshakemus-id]
  (let [rows (query tx "SELECT count(*) FROM menoluokka_muutoshakemus WHERE muutoshakemus_id = ?" [muutoshakemus-id])]
    (> (:count (first rows)) 0)))

(defn- store-muutoshakemus-paatos [muutoshakemus-id paatos decider avustushaku-id]
  (with-tx (fn [tx]
             (let [muutoshakemus (first (query tx "SELECT * FROM muutoshakemus WHERE id = ?" [muutoshakemus-id]))
                   created-paatos (first (query tx
                                                "INSERT INTO virkailija.paatos (user_key, reason, decider)
                                                 VALUES (?, ?, ?)
                                                 RETURNING id, reason, decider, user_key, created_at, updated_at"
                                                [(generate-hash-id) (:reason paatos) decider]))
                   paatos-id (:id created-paatos)]
               (execute! tx
                         "UPDATE virkailija.muutoshakemus
                         SET paatos_id = ?
                         WHERE id = ?" [paatos-id muutoshakemus-id])
               (when (:haen-kayttoajan-pidennysta muutoshakemus)
                 (store-paatos-jatkoaika tx paatos-id (get-in paatos [:haen-kayttoajan-pidennysta :status]) (get-in paatos [:haen-kayttoajan-pidennysta :paattymispaiva])))
               (when (muutoshakemus-has-talousarvio? tx muutoshakemus-id)
                 (store-paatos-talousarvio tx paatos-id (get-in paatos [:talousarvio :status])))
               (when (:talousarvio paatos)
                 (add-paatos-menoluokkas tx paatos-id avustushaku-id (get-in paatos [:talousarvio :talousarvio])))
               (when (some? (:haen-sisaltomuutosta paatos))
                 (store-paatos-sisaltomuutos tx paatos-id (get-in paatos [:haen-sisaltomuutosta :status])))
               created-paatos))))

(defn get-hyvaksytty-paattymispaiva [paatos-id]
  (-> (query "SELECT to_char(pj.paattymispaiva, 'YYYY-MM-DD') as paatos_hyvaksytty_paattymispaiva
              FROM paatos p
              JOIN paatos_jatkoaika pj ON pj.paatos_id = p.id
              WHERe p.id = ?"
             [paatos-id])
      first
      :paatos-hyvaksytty-paattymispaiva))

(defn- get-talousarvio-paatos-status [paatos-id]
  (-> (query "SELECT pt.status
               FROM paatos_talousarvio pt
               JOIN paatos ON paatos.id = pt.paatos_id
               where paatos.id = ?"
             [paatos-id])
      first
      :status))

(defn get-jatkoaika-paatos-status [paatos-id]
  (-> (query "SELECT status
              FROM paatos p
              JOIN paatos_jatkoaika pj ON pj.paatos_id = p.id
              WHERe p.id = ?"
             [paatos-id])
      first
      :status))

(defn keskeyta-aloittamatta [tx id keskeyta]
  (let [new-hakemus (hakemus-copy/create-new-hakemus-version tx id)]
    (execute! tx "UPDATE hakemukset SET
                keskeytetty_aloittamatta = ?
              WHERE id = ? AND version = ?" [keskeyta (:id new-hakemus) (:version new-hakemus)])))

(defn create-muutoshakemus-paatos [muutoshakemus-id paatos decider avustushaku-id]
  (if-let [created-paatos (store-muutoshakemus-paatos muutoshakemus-id paatos decider avustushaku-id)]
    (-> created-paatos
        (assoc :paatos-hyvaksytty-paattymispaiva (get-hyvaksytty-paattymispaiva (:id created-paatos)))
        (assoc :status-jatkoaika (get-jatkoaika-paatos-status (:id created-paatos)))
        (assoc :status-sisaltomuutos (get-sisaltomuutos-paatos-status (:id created-paatos)))
        (assoc :status-talousarvio (get-talousarvio-paatos-status (:id created-paatos)))
        (assoc :talousarvio (get-talousarvio (:id created-paatos) "paatos")))))

(defn get-menoluokkas [avustushaku-id]
  (query "SELECT type, translation_fi, translation_sv FROM virkailija.menoluokka WHERE avustushaku_id = ?" [avustushaku-id]))

(defn get-normalized-hakemus [hakemus-id]
  (log/info (str "Get normalized hakemus with id: " hakemus-id))
  (let [hakemukset (query "SELECT
                            n.id,
                            n.hakemus_id,
                            n.contact_person,
                            n.contact_email,
                            n.contact_phone,
                            n.project_name,
                            n.created_at,
                            n.updated_at,
                            n.organization_name,
                            n.register_number,
                            n.trusted_contact_name,
                            n.trusted_contact_email,
                            n.trusted_contact_phone
                          FROM virkailija.normalized_hakemus n
                          JOIN hakija.hakemukset h ON h.id = n.hakemus_id
                          JOIN hakija.avustushaut a ON a.id = h.avustushaku
                          WHERE h.version_closed IS NULL
                          AND n.hakemus_id = ?" [hakemus-id])
        hakemus (first hakemukset)
        talousarvio (get-talousarvio hakemus-id "hakemus")]
    (log/info (str "Succesfully fetched hakemus with id: " hakemus-id))
    (if hakemus
      (into {} (filter (comp some? val) (assoc hakemus :talousarvio talousarvio)))
      nil)))

(defn onko-muutoshakukelpoinen-avustushaku-ok [avustushaku-id]
  (let [found-fields
        (query "with recursive formfield(form_id, formfield_id, label, children) as (
                  select
                    forms.id as form_id,
                    e.value->>'id' as formfield_id,
                    e.value->'label'->>'fi' as label,
                    e.value->'children' as children
                  from forms
                  join jsonb_array_elements(forms.content) e on true
                  union all
                  select
                    parent.form_id,
                    child->>'id' as formfield_id,
                    child->'label'->>'fi' as label,
                    child->'children' as children
                  from formfield parent
                  join jsonb_array_elements(parent.children) child on true
                )
                select formfield.formfield_id as id, formfield.label
                from avustushaut
                join formfield on formfield.form_id = avustushaut.form
                where avustushaut.id = ?
                and (
                  formfield.formfield_id = ANY(ARRAY['applicant-name','primary-email','textField-0'])
                  or formfield.formfield_id = 'financing-plan' and
                     exists(select formfield.children->'budget'->'project-budget' from formfield)
                 )", [avustushaku-id])
        required-fields [{:id "applicant-name"}
                         {:id "primary-email"}
                         {:id "textField-0"}
                         {:id "financing-plan"}]
        found-field-ids (map (fn [x] (:id x)) found-fields)
        missing-fields (remove (fn [x] (.contains found-field-ids (:id x))) required-fields)
        is-ok (empty? missing-fields)]
    {:is-ok is-ok
     :ok-fields found-fields
     :erroneous-fields missing-fields}))

(defn has-multiple-menoluokka-rows [hakemus-id]
  (let [result (first (query "SELECT COUNT(id) FROM menoluokka_hakemus WHERE hakemus_id = ?" [hakemus-id]))]
    (> (:count result) 1)))

(defn get-hakemus-ids-having-taydennyspyynto [avustushaku-id]
  (log/info (str "Get hakemus IDs having taydennyspyynto for avustushaku: " avustushaku-id))
  (map :id (query "SELECT distinct id
                  FROM hakemukset
                  WHERE status = 'pending_change_request'
                  AND avustushaku = ?" [avustushaku-id])))

(defn get-muutoshakemukset [hakemus-id]
  (log/info (str "Get muutoshakemus with hakemus id: " hakemus-id))
  (let [basic-muutoshakemukset (query
                                "SELECT
                                m.id,
                                m.hakemus_id,
                                (CASE
                                  WHEN m.paatos_id IS NULL
                                  THEN 'new'
                                  ELSE
                                    -- Tää toimii ns. oikein eli wanhalla tavalla kun kaikille osioille on
                                    -- annettu sama hyväksytty/hylätty päätös
                                    coalesce(pj.status, ps.status, pt.status)::text
                                END) as status,
                                pj.status as paatos_status_jatkoaika,
                                pt.status as paatos_status_talousarvio,
                                ps.status as paatos_status_sisaltomuutos,
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
                                p.reason as paatos_reason,
                                to_char(pj.paattymispaiva, 'YYYY-MM-DD') as paatos_hyvaksytty_paattymispaiva,
                                ee.created_at as paatos_sent_at
                              FROM virkailija.muutoshakemus m
                              LEFT JOIN virkailija.paatos p ON m.paatos_id = p.id
                              LEFT JOIN virkailija.paatos_jatkoaika pj ON pj.paatos_id = p.id
                              LEFT JOIN virkailija.paatos_talousarvio pt ON pt.paatos_id = p.id
                              LEFT JOIN virkailija.paatos_sisaltomuutos ps ON ps.paatos_id = p.id
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
    (exec queries/upsert-arvio<! arvio-with-changelog)))

(defn health-check []
  (->> {}
       (query "select 1")
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
    (exec queries/upsert-score<! params)))

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

(defn- parameter-list [list]
  (clojure.string/join ", " (take (count list) (repeat "?"))))

(defn copy-menoluokka-rows [tx from-application-id to-application-id]
  (execute! tx
            "INSERT INTO virkailija.menoluokka (avustushaku_id, type, translation_fi, translation_sv)
            SELECT ?, type, translation_fi, translation_sv
            FROM virkailija.menoluokka
            WHERE avustushaku_id = ?"
            [to-application-id from-application-id]))

(defn get-valmistelija-emails-assigned-to-avustushaku [avustushaku-id]
  (let [sql "SELECT   DISTINCT(email)
             FROM     hakija.avustushaku_roles
             WHERE    avustushaku = ? AND (role = 'presenting_officer' OR role = 'vastuuvalmistelija')
             ORDER BY email"
        result (map :email (query sql [avustushaku-id]))]
    (log/info "Found valmistelija emails " result "for avustushaku ID" avustushaku-id)
    result))

(defn update-submitted-hakemus-version [hakemus-id]
  (execute! "UPDATE hakija.hakemukset
             SET submitted_version = version
             WHERE id = ? AND version_closed is null" [hakemus-id]))

(defn get-raportointivelvoitteet [avustushaku-id]
  (query "SELECT id, raportointilaji, asha_tunnus, maaraaika, lisatiedot
          FROM raportointivelvoite
          WHERE avustushaku_id = ?
          ORDER BY id" [avustushaku-id]))

(defn get-arviointi-dropdown-avustushaut []
  (query "
  WITH avustukset AS (
  SELECT
    id,
    content->'name'->'fi' as name,
    to_char((content->'duration'->>'start')::timestamp at time zone 'UTC' at time zone 'Europe/Helsinki', 'DD.MM.YYYY') as start_date
    FROM avustushaut
    WHERE (status = 'resolved' OR status = 'published')
    order by to_date(content#>>'{duration,start}','yyyy-MM-ddTHH24:MI:SS.MS') desc, id desc
  )
  SELECT id,
         concat(name, ' (', start_date, ')') as name
  FROM avustukset", []))

(defn insert-raportointivelvoite [avustushaku-id velvoite]
  (let [id (query "INSERT INTO raportointivelvoite (avustushaku_id, raportointilaji, asha_tunnus, maaraaika, lisatiedot)
                   VALUES (?, ?, ?, ?, ?)
                   RETURNING id"
                  [avustushaku-id (:raportointilaji velvoite) (:asha-tunnus velvoite) (:maaraaika velvoite) (:lisatiedot velvoite)])]
    (assoc velvoite :id (:id (first id)))))

(defn update-raportointivelvoite [avustushaku-id velvoite]
  (execute! "UPDATE raportointivelvoite
             SET raportointilaji = ?,
                 asha_tunnus = ?,
                 maaraaika = ?,
                 lisatiedot = ?
             WHERE avustushaku_id = ? AND id = ?"
            [(:raportointilaji velvoite) (:asha-tunnus velvoite) (:maaraaika velvoite) (:lisatiedot velvoite) avustushaku-id (:id velvoite)]))

(defn delete-raportointivelvoite [avustushaku-id raportointivelvoite-id]
  (execute! "DELETE FROM raportointivelvoite
             WHERE avustushaku_id = ? AND id = ?"
            [avustushaku-id raportointivelvoite-id]))

(defn get-lainsaadanto-options []
  (query "SELECT id, name
          FROM lainsaadanto" []))

(defn get-avustushaku-lainsaadanto [avustushaku-id]
  (let [lainsaadantos (query "SELECT lainsaadanto_id
                              FROM avustushaku_lainsaadanto
                              WHERE avustushaku_id = ?" [avustushaku-id])]
    (map :lainsaadanto-id lainsaadantos)))

(defn- upsert-lainsaadanto [avustushaku-id lainsaadanto-id]
  (let [id-rows (query "INSERT INTO avustushaku_lainsaadanto (avustushaku_id, lainsaadanto_id)
                        VALUES (?, ?)
                        ON CONFLICT (avustushaku_id, lainsaadanto_id) DO UPDATE SET
                          lainsaadanto_id = EXCLUDED.lainsaadanto_id
                        RETURNING lainsaadanto_id"
                       [avustushaku-id lainsaadanto-id])]
    (:lainsaadanto-id (first id-rows))))

(defn- remove-old-lainsaadanto [avustushaku-id current-lainsaadanto-ids]
  (execute!
   (str "DELETE FROM avustushaku_lainsaadanto
          WHERE avustushaku_id = ? AND lainsaadanto_id NOT IN (" (parameter-list current-lainsaadanto-ids) ")")
   (conj current-lainsaadanto-ids avustushaku-id)))

(defn upsert-avustushaku-lainsaadanto [avustushaku-id lainsaadanto-ids]
  (if (> (count lainsaadanto-ids) 0)
    (let [ids (map (partial upsert-lainsaadanto avustushaku-id) lainsaadanto-ids)]
      (remove-old-lainsaadanto avustushaku-id ids))
    (execute! "DELETE FROM avustushaku_lainsaadanto WHERE avustushaku_id = ?" [avustushaku-id])))
