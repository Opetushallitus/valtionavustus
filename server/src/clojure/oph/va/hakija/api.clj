(ns oph.va.hakija.api
  (:use [clojure.data :as data])
  (:require
   [clj-time.core :as clj-time]
   [clojure.java.io :as io]
   [clojure.string :as string]
   [clojure.tools.logging :as log]
   [oph.common.datetime :as datetime]
   [oph.soresu.common.db :refer [escape-like-pattern execute!
                                 get-next-exception-or-original named-execute!
                                 named-query query query-original-identifiers
                                 with-transaction with-tx]]
   [oph.soresu.form.db :refer [update-form!]]
   [oph.soresu.form.formhandler :as formhandler]
   [oph.va.environment :as environment]
   [oph.va.hakemus.db :as hakemus-copy]
   [oph.va.hakija.db :refer [get-hakemus-by-id-tx]]
   [oph.va.hakija.domain :as hakija-domain]
   [oph.va.hakija.jotpa :refer [is-jotpa-avustushaku]]
   [oph.va.jdbc.enums]
   [oph.va.menoluokka.db :refer [upsert-menoluokka-rows]]
   [oph.soresu.common.config :refer [config]]
   [oph.va.routes :refer :all]
   [oph.va.virkailija.authorization :as authorization]
   [oph.va.virkailija.email :as email]
   [ring.util.http-response :refer [bad-request conflict! ok]])
  (:import
   (oph.va.jdbc.enums HakuRole HakuStatus HakuType)))

(defn convert-attachment [attachment]
  {:id (:id attachment)
   :hakemus-id (:hakemus_id attachment)
   :version (:version attachment)
   :field-id (:field_id attachment)
   :file-size (:file_size attachment)
   :content-type (:content_type attachment)
   :hakemus-version (:hakemus_version attachment)
   :created-at (:created_at attachment)
   :filename (:filename attachment)})

(defn attachments->map [attachments]
  (->> attachments
       (map convert-attachment)
       (map (fn [attachment] [(:field-id attachment) attachment]))
       (into {})))

(defn- in-list-placeholders [n]
  (string/join "," (repeat n "?")))

(def ^:private get-avustushaku-sql
  "select avustushaut.*, va_code_values.code as operational_unit_code
   from hakija.avustushaut
   left join virkailija.va_code_values on avustushaut.operational_unit_id = va_code_values.id
   where avustushaut.id = ?")

(defn- copy-form [tx id created-at]
  (:id (first (query-original-identifiers tx
                                          "INSERT INTO forms (content, rules, created_at, updated_at)
                 SELECT content, rules, ?::timestamptz, ?::timestamptz FROM forms WHERE id = ?
                 RETURNING *"
                                          [created-at created-at id]))))

(defn create-avustushaku [tx avustushaku-content template-form-id loppuselvitys-id valiselvitys-id decision haku-type operational-unit-id muutoshakukelpoinen created-at]
  (let [created-timestamp    (datetime/datetime->str created-at)
        form-id              (copy-form tx template-form-id created-timestamp)
        new-loppuselvitys-id (when loppuselvitys-id
                               (copy-form tx loppuselvitys-id created-timestamp))
        new-valiselvitys-id  (when valiselvitys-id
                               (copy-form tx valiselvitys-id created-timestamp))
        avustushaku-row      (first (named-query tx
                                                 "INSERT INTO avustushaut
                               (form, content, register_number, decision, haku_type,
                                operational_unit_id, muutoshakukelpoinen, form_loppuselvitys,
                                form_valiselvitys, created_at)
                               VALUES (:form, :content, :register_number, :decision, :haku_type,
                                :operational_unit_id, :muutoshakukelpoinen, :form_loppuselvitys,
                                :form_valiselvitys, CAST(:created_at AS timestamptz))
                               RETURNING *"
                                                 {:form form-id
                                                  :content avustushaku-content
                                                  :haku_type (new HakuType haku-type)
                                                  :register_number nil
                                                  :decision decision
                                                  :operational_unit_id operational-unit-id
                                                  :form_loppuselvitys new-loppuselvitys-id
                                                  :form_valiselvitys new-valiselvitys-id
                                                  :muutoshakukelpoinen muutoshakukelpoinen
                                                  :created_at (datetime/datetime->str created-at)}))]
    (->> (query-original-identifiers tx get-avustushaku-sql [(:id avustushaku-row)])
         (map avustushaku-response-content)
         first)))

(defn get-hakemus [hakemus-id]
  (first (query-original-identifiers
          "select * from hakemukset where id = ? AND version_closed IS NULL"
          [hakemus-id])))

(defn get-hakemus-by-user-key [user-key]
  (first (query-original-identifiers
          "select * from hakemukset where user_key = ? AND version_closed IS NULL"
          [user-key])))

(defn get-hakemus-submission [hakemus]
  (first (query-original-identifiers
          "select * from form_submissions where id = ? and version = ?"
          [(:form_submission_id hakemus) (:form_submission_version hakemus)])))

(defn diff-paatos [old new]
  (data/diff (dissoc old :updatedAt)
             (dissoc new :updatedAt)))

(defn update-avustushaku [avustushaku]
  (let [haku-status (if (= (:status avustushaku) "new")
                      (new HakuStatus "draft")
                      (new HakuStatus (:status avustushaku)))
        content (hakija-domain/cleanup-avustushaku-content (:content avustushaku))
        avustushaku-to-save (assoc avustushaku
                                   :status haku-status
                                   :content content
                                   :register_number (:register-number avustushaku)
                                   :hallinnoiavustuksia_register_number (:hallinnoiavustuksia-register-number avustushaku)
                                   :is_academysize (:is_academysize avustushaku)
                                   :haku_type (new HakuType (:haku-type avustushaku))
                                   :hankkeen_alkamispaiva (:hankkeen-alkamispaiva avustushaku)
                                   :hankkeen_paattymispaiva (:hankkeen-paattymispaiva avustushaku)
                                   :operational_unit_id (:operational-unit-id avustushaku)
                                   :muutoshakukelpoinen (:muutoshakukelpoinen avustushaku)
                                   :loppuselvitys_otantatarkastus_enabled (:loppuselvitys-otantatarkastus-enabled avustushaku))]

    (with-transaction connection
      (let [previous-avustushaku-version
            (first (query-original-identifiers connection
                                               "INSERT INTO archived_avustushaut
                      (avustushaku_id, form_id, created_at, status, haku_type, register_number,
                       is_academysize, content, decision, operational_unit_id,
                       hankkeen_alkamispaiva, hankkeen_paattymispaiva, muutoshakukelpoinen,
                       loppuselvitys_otantatarkastus_enabled)
                      SELECT id, form, created_at, status, haku_type, register_number,
                       is_academysize, content, decision, operational_unit_id,
                       hankkeen_alkamispaiva, hankkeen_paattymispaiva, muutoshakukelpoinen,
                       loppuselvitys_otantatarkastus_enabled
                      FROM avustushaut WHERE id = ?
                      RETURNING *"
                                               [(:id avustushaku-to-save)]))
            previous-paatos-version (:decision previous-avustushaku-version)
            new-paatos-version (:decision avustushaku)
            diff-result (diff-paatos previous-paatos-version new-paatos-version)
            update-sql
            "UPDATE avustushaut
             SET content = :content, form = :form, status = :status,
             haku_type = :haku_type, register_number = :register_number,
             hallinnoiavustuksia_register_number = :hallinnoiavustuksia_register_number,
             is_academysize = :is_academysize, decision = :decision,
             hankkeen_alkamispaiva = :hankkeen_alkamispaiva,
             hankkeen_paattymispaiva = :hankkeen_paattymispaiva,
             loppuselvitysdate = :loppuselvitysdate, valiselvitysdate = :valiselvitysdate,
             operational_unit_id = :operational_unit_id,
             muutoshakukelpoinen = :muutoshakukelpoinen,
             loppuselvitys_otantatarkastus_enabled = :loppuselvitys_otantatarkastus_enabled,
             allow_visibility_in_external_system = :allow_visibility_in_external_system,
             arvioitu_maksupaiva = :arvioitu_maksupaiva
             WHERE id = :id"]
        (if (and (= nil (first diff-result)) (= nil (first (rest diff-result))))
          (named-execute! connection update-sql avustushaku-to-save)
          (let [updated-paatos (merge new-paatos-version {:updatedAt (clj-time/now)})
                avustushaku-with-updated-decision (merge avustushaku-to-save {:decision updated-paatos})]
            (named-execute! connection update-sql avustushaku-with-updated-decision)))))
    (->> (query-original-identifiers get-avustushaku-sql [(:id avustushaku-to-save)])
         (map avustushaku-response-content)
         first)))

(defn get-avustushaku [id]
  (first (query-original-identifiers get-avustushaku-sql [id])))

(defn get-avustushaku-tx [tx id]
  (first (query-original-identifiers tx get-avustushaku-sql [id])))

(defn- map-status-list [statuses]
  (map (fn [status] (new HakuStatus status)) statuses))

(defn get-avustushaku-by-status [avustushaku-id statuses]
  (let [status-list (map-status-list statuses)]
    (first (query-original-identifiers
            (str "select * from avustushaut where id = ? and status in ("
                 (in-list-placeholders (count status-list)) ")")
            (into [avustushaku-id] status-list)))))

(defn list-avustushaut []
  (map avustushaku-response-content
       (query-original-identifiers
        "select * from avustushaut where status <> 'deleted'
          order by to_date(content#>>'{duration,start}','yyyy-MM-ddTHH24:MI:SS.MS') desc, id desc"
        [])))

(defn list-avustushaut-by-status [statuses]
  (if statuses
    (let [status-list (map-status-list statuses)]
      (map avustushaku-response-content
           (query-original-identifiers
            (str "select * from avustushaut where status in ("
                 (in-list-placeholders (count status-list))
                 ") order by to_date(content#>>'{duration,start}','yyyy-MM-ddTHH24:MI:SS.MS') desc, id desc")
            (vec status-list))))
    (list-avustushaut)))

(defn- role->json [role]
  {:id (:id role)
   :name (:name role)
   :email (:email role)
   :role (:role role)
   :oid (:oid role)})

(defn- change-existing-vastuuvalmistelija-to-valmistelija [tx avustushaku-id]
  (execute! tx
            "UPDATE hakija.avustushaku_roles SET role = 'presenting_officer'
             WHERE avustushaku = ? AND role = 'vastuuvalmistelija'"
            [avustushaku-id]))

(defn create-avustushaku-role [tx role]
  (let [role-enum (new HakuRole (:role role))
        role-to-save (assoc role :role role-enum)
        delete (when (= (:role role) "vastuuvalmistelija") (change-existing-vastuuvalmistelija-to-valmistelija tx (:avustushaku role)))
        role-row (first (query-original-identifiers tx
                                                    "insert into avustushaku_roles (avustushaku, role, name, email, oid)
                           values (?, ?, ?, ?, ?) RETURNING *"
                                                    [(:avustushaku role-to-save) (:role role-to-save)
                                                     (:name role-to-save) (:email role-to-save) (:oid role-to-save)]))]
    (->> (query-original-identifiers tx
                                     "select * from avustushaku_roles where id = ?"
                                     [(:id role-row)])
         (map role->json)
         first)))

(defn delete-avustushaku-role [avustushaku-id role-id]
  (execute! "delete from avustushaku_roles where id = ? and avustushaku = ?"
            [role-id avustushaku-id]))

(defn update-avustushaku-role [tx avustushaku-id role]
  (let [role-enum (new HakuRole (:role role))
        role-to-save (assoc (assoc role :role role-enum) :avustushaku avustushaku-id)
        delete (when (= (:role role) "vastuuvalmistelija") (change-existing-vastuuvalmistelija-to-valmistelija tx avustushaku-id))]
    (execute! tx
              "UPDATE hakija.avustushaku_roles
               SET avustushaku = ?, role = ?, name = ?, email = ?
               WHERE id = ?"
              [avustushaku-id role-enum (:name role) (:email role) (:id role)])
    (->> (query-original-identifiers
          "select * from avustushaku_roles where id = ?"
          [(:id role-to-save)])
         (map role->json)
         first)))

(defn get-avustushaku-roles [avustushaku-id]
  (->> (query-original-identifiers
        "select * from avustushaku_roles where avustushaku = ?"
        [avustushaku-id])
       (map role->json)))

(defn get-avustushaku-role-by-avustushaku-id-and-person-oid [avustushaku-id person-oid]
  (->> (query-original-identifiers
        "select * from avustushaku_roles where avustushaku = ? and oid = ?"
        [avustushaku-id person-oid])
       (map role->json)
       first))

(defn get-avustushaku-role-by-avustushaku-id-and-person-oid-tx [tx avustushaku-id person-oid]
  (->> [avustushaku-id person-oid]
       (query tx "SELECT * FROM avustushaku_roles WHERE avustushaku = ? AND oid = ?")
       (map role->json)
       first))

(defn form->json [form]
  (let [form-for-rendering (formhandler/add-koodisto-values form)]
    {:content (:content form-for-rendering)
     :rules (:rules form-for-rendering)}))

(defn- hakemus->json [hakemus]
  {:id (:id hakemus)
   :version (:version hakemus)
   :version-date (:created_at hakemus)
   :project-name (:project_name hakemus)
   :language (:language hakemus)
   :organization-name (:organization_name hakemus)
   :budget-oph-share (:budget_oph_share hakemus)
   :budget-total (:budget_total hakemus)
   :status (:status hakemus)
   :status-comment (:status_change_comment hakemus)
   :user-first-name (:user_first_name hakemus)
   :user-last-name (:user_last_name hakemus)
   :user-oid (:user_oid hakemus)
   :register-number (:register_number hakemus)
   :user-key (:user_key hakemus)
   :selvitys-email (:selvitys_email hakemus)
   :status-loppuselvitys (:status_loppuselvitys hakemus)
   :loppuselvitys-information-verified-by (:loppuselvitys_information_verified_by hakemus)
   :loppuselvitys-information-verified-at (:loppuselvitys_information_verified_at hakemus)
   :loppuselvitys-information-verification (:loppuselvitys_information_verification hakemus)
   :loppuselvitys-taloustarkastanut-name (:loppuselvitys_taloustarkastanut_name hakemus)
   :loppuselvitys-taloustarkastettu-at (:loppuselvitys_taloustarkastettu_at hakemus)
   :loppuselvitys-otantapolku (:loppuselvitys_otantapolku hakemus)
   :loppuselvitys-riskiperusteinen (:loppuselvitys_riskiperusteinen hakemus)
   :status-valiselvitys (:status_valiselvitys hakemus)
   :status-muutoshakemus (:status_muutoshakemus hakemus)
   :answers (:answer_values hakemus)
   :refused (get hakemus :refused false)
   :refused-comment (:refused_comment hakemus)
   :refused-at (:refused_at hakemus)
   :keskeytetty-aloittamatta (:keskeytetty_aloittamatta hakemus)
   :submitted-version (:submitted_version hakemus)
   :loppuselvitys-change-request-pending (:loppuselvitys_change_request_pending hakemus)
   :loppuselvitys-change-request-sent (:loppuselvitys_change_request_sent hakemus)
   :asiatarkastus-checklist (when (some? (:checklist_avustus_kaytetty hakemus))
                              {:avustus-kaytetty-paatoksen-mukaisesti (:checklist_avustus_kaytetty hakemus)
                               :omarahoitus-kaytetty (:checklist_omarahoitus hakemus)
                               :taloustiedot-kirjattu (:checklist_taloustiedot hakemus)
                               :avustus-alle-100k (:checklist_alle_100k hakemus)})})

(defn- paatos-sent-emails->json [paatos]
  {:id (:id paatos)
   :version (:version paatos)
   :project-name (:project_name paatos)
   :organization-name (:organization_name paatos)
   :sent-emails (:sent_emails paatos)
   :view_count (:view_count paatos)
   :user_key (:user_key paatos)
   :sent-time (:sent_time paatos)})

(defn- hakemukset->json [hakemukset]
  (map hakemus->json hakemukset))

(defn- convert-attachment-group [group]
  (let [id (-> group first :hakemus_id)]
    [id (attachments->map group)]))

(defn get-form-by-avustushaku [avustushaku-id]
  (first (query-original-identifiers
          "select f.* from hakija.forms f
            join hakija.avustushaut a on a.form = f.id
            where a.id = ?"
          [avustushaku-id])))

(defn get-form-by-id [id]
  (first (query-original-identifiers
          "select * from hakija.forms where id = ?"
          [id])))

(defn get-paatos-email-status [avustushaku-id]
  (let [paatos-sent-emails
        (query-original-identifiers
         "select h.id, h.version, h.organization_name, h.project_name, h.user_key,
                  hd.sent_emails, hd.sent_time, count(hpv.view_time) as view_count,
                  h.refused, h.refused_comment, h.refused_at
           from hakija.hakemukset h
             left outer join hakija.hakemus_paatokset hd on (hd.hakemus_id = h.id)
             left outer join hakija.hakemus_paatokset_views hpv on (hpv.hakemus_id = h.id)
           where h.avustushaku = ?
                 and h.refused is not true
                 and h.status = 'submitted'
                 and h.version_closed is null
           group by h.id, h.version, h.organization_name, h.project_name, hd.sent_emails, hd.sent_time
           order by hd.sent_time desc"
         [avustushaku-id])]
    (map paatos-sent-emails->json paatos-sent-emails)))

(defn find-paatos-views [hakemus-id]
  (query-original-identifiers
   "select * from hakemus_paatokset_views where hakemus_id = ? order by view_time desc"
   [hakemus-id]))

(defn add-paatos-sent-emails [hakemus emails decision]
  (execute!
   "insert into hakija.hakemus_paatokset (hakemus_id, hakemus_version, sent_emails, decision)
     values (?, ?, ?, ?)"
   [(:id hakemus) (:version hakemus) {:addresses emails} decision]))

(defn update-paatos-sent-emails [hakemus emails decision]
  (execute!
   "update hakija.hakemus_paatokset
     set sent_emails = ?, decision = ?, sent_time = now()
     where hakemus_id = ? and hakemus_version = ?"
   [{:addresses emails} decision (:id hakemus) (:version hakemus)]))

(defn find-regenerate-hakemus-paatos-ids [avustushaku-id]
  (query-original-identifiers
   "select distinct hp.hakemus_id
     from hakija.hakemukset h
     inner join hakemus_paatokset hp on hp.hakemus_id = h.id
     where avustushaku = ? and version_closed is null"
   [avustushaku-id]))

(defn update-paatos-decision [hakemus-id decision]
  (execute!
   "update hakija.hakemus_paatokset set decision = ? where hakemus_id = ?"
   [decision hakemus-id]))

(def ^:private list-hakemukset-by-avustushaku-sql
  "select  h.id,
        h.version,
        h.created_at,
        h.organization_name,
        h.project_name,
        h.language,
        h.status,
        h.status_change_comment,
        h.budget_total,
        h.budget_oph_share,
        s.answers->'value' as answer_values,
        h.user_key,
        h.register_number,
        h.status_loppuselvitys,
        h.status_valiselvitys,
        h.loppuselvitys_information_verified_by,
        h.loppuselvitys_information_verified_at,
        h.loppuselvitys_information_verification,
        h.loppuselvitys_taloustarkastettu_at,
        h.loppuselvitys_taloustarkastanut_name,
        h.loppuselvitys_otantapolku,
        h.loppuselvitys_riskiperusteinen,
        (select
          (CASE
            WHEN m.paatos_id IS NULL
            THEN 'new'
            ELSE
              coalesce(pj.status, pt.status, ps.status)::text
          END) as status_muutoshakemus
          from  virkailija.muutoshakemus m
          LEFT JOIN virkailija.paatos ON m.paatos_id = virkailija.paatos.id
          LEFT JOIN virkailija.paatos_jatkoaika pj ON pj.paatos_id = paatos.id
          LEFT JOIN virkailija.paatos_talousarvio pt ON pt.paatos_id = paatos.id
          LEFT JOIN virkailija.paatos_sisaltomuutos ps ON ps.paatos_id = paatos.id
          where m.hakemus_id = h.id
          order by m.created_at desc limit 1),
        h.refused,
        h.refused_comment,
        h.refused_at,
        h.keskeytetty_aloittamatta,
        (SELECT count(*) > 0
              FROM hakija.hakemukset
              WHERE parent_id = h.id
              AND hakemus_type='loppuselvitys'
              AND status = 'pending_change_request'
              AND version_closed IS null) AS loppuselvitys_change_request_pending,
        (SELECT count(id) > 0
              FROM hakija.hakemukset
              WHERE status = 'pending_change_request'
              AND hakemus_type='loppuselvitys'
              AND parent_id = h.id) AS loppuselvitys_change_request_sent,
        submitted_version,
        ac.avustus_kaytetty_paatoksen_mukaisesti as checklist_avustus_kaytetty,
        ac.omarahoitus_kaytetty as checklist_omarahoitus,
        ac.taloustiedot_kirjattu as checklist_taloustiedot,
        ac.avustus_alle_100k as checklist_alle_100k
  from hakija.hakemukset h
  join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
  left join virkailija.loppuselvitys_asiatarkastus_checklist ac on ac.hakemus_id = h.id
where h.avustushaku = ?
      and h.status != 'cancelled'
      and h.status != 'new'
      and h.version_closed is null
      and h.hakemus_type='hakemus'
order by upper(h.organization_name), upper(h.project_name)")

(def ^:private list-attachments-by-avustushaku-sql
  "select attachments.id, attachments.version, hakemus_id, hakemus_version, attachments.created_at,
       field_id, filename, file_size, content_type
   from attachments
   join hakemukset on hakemus_id = hakemukset.id AND
                      hakemus_version = hakemukset.version
   where hakemukset.avustushaku = ? and
         attachments.version_closed is null
   order by hakemus_id")

(defn get-hakudata [avustushaku-id]
  (when-let [avustushaku (get-avustushaku avustushaku-id)]
    (let [form (get-form-by-avustushaku avustushaku-id)
          roles (get-avustushaku-roles avustushaku-id)
          hakemukset (query-original-identifiers list-hakemukset-by-avustushaku-sql [avustushaku-id])
          attachments (query-original-identifiers list-attachments-by-avustushaku-sql [avustushaku-id])]
      {:avustushaku (avustushaku-response-content avustushaku)
       :environment (environment/get-content)
       :roles roles
       :form (form->json form)
       :hakemukset (hakemukset->json hakemukset)
       :attachments (->> attachments
                         (partition-by (fn [attachment] (:hakemus_id attachment)))
                         (mapv convert-attachment-group)
                         (into {}))
       :budget-total-sum (reduce + (map :budget_total hakemukset))
       :budget-oph-share-sum (reduce + (map :budget_oph_share hakemukset))})))

(defn get-hakemukset-for-export [hakemus-type avustushaku-id]
  (->> (query-original-identifiers
        "select
            h.id, h.version, h.created_at, h.organization_name, h.project_name,
            h.language, h.status, h.budget_total, h.budget_oph_share,
            s.answers->'value' as answer_values,
            h.register_number, h.status_loppuselvitys, h.status_valiselvitys
          from hakija.hakemukset h
            join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
          where h.avustushaku = ?
            and h.status in ('submitted', 'pending_change_request', 'officer_edit', 'applicant_edit')
            and h.version_closed is null
            and h.hakemus_type = ?
          order by h.register_number"
        [avustushaku-id hakemus-type])
       hakemukset->json))

(defn list-hakemus-change-requests [hakemus-id]
  (hakemukset->json
   (query-original-identifiers
    "select h.id, h.version, h.created_at, h.user_oid,
              h.status, h.status_change_comment, h.user_first_name, h.user_last_name,
              h.organization_name, h.project_name, h.language, h.budget_total, h.budget_oph_share,
              s.answers->'value' as answer_values, h.user_key, h.register_number
       from hakija.hakemukset h
         join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
       where h.id = ? and h.status in ('pending_change_request', 'officer_edit') and h.last_status_change_at = h.created_at
       order by h.version"
    [hakemus-id])))

(def ^:private get-by-type-and-parent-id-sql
  "select *, s.answers->'value' as answer_values
   from hakija.hakemukset h
     join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
   where h.hakemus_type = ?
         and h.parent_id = ?
         and (h.status='submitted' or h.status='pending_change_request')
         and h.version_closed is null")

(defn get-selvitysdata [avustushaku-id hakemus-id]
  (let [avustushaku (get-avustushaku avustushaku-id)
        loppuselvitys-form-id (:form_loppuselvitys avustushaku)
        loppuselvitys-form (get-form-by-id loppuselvitys-form-id)
        loppuselvitys (first (query-original-identifiers get-by-type-and-parent-id-sql ["loppuselvitys" hakemus-id]))
        loppuselvitys-change-requests (list-hakemus-change-requests (:id loppuselvitys))
        valiselvitys-form-id (:form_valiselvitys avustushaku)
        valiselvitys-form (get-form-by-id valiselvitys-form-id)
        valiselvitys (first (query-original-identifiers get-by-type-and-parent-id-sql ["valiselvitys" hakemus-id]))
        attachments (query-original-identifiers list-attachments-by-avustushaku-sql [avustushaku-id])]
    {:loppuselvitysForm (form->json loppuselvitys-form)
     :valiselvitysForm (form->json valiselvitys-form)
     :loppuselvitys (if loppuselvitys (hakemus->json loppuselvitys) {})
     :loppuselvitysChangeRequests loppuselvitys-change-requests
     :valiselvitys (if valiselvitys (hakemus->json valiselvitys) {})
     :attachments (->> attachments
                       (partition-by (fn [attachment] (:hakemus_id attachment)))
                       (mapv convert-attachment-group)
                       (into {}))}))

(defn update-selvitys-message [selvitys-email]
  (let [hakemus-id (:selvitys-hakemus-id selvitys-email)
        message (:message selvitys-email)
        to (:to selvitys-email)
        subject (:subject selvitys-email)
        today-date (datetime/date-string (datetime/now))
        email {:message message
               :subject subject
               :send today-date
               :to to}]

    (execute!
     "update hakija.hakemukset set selvitys_email = ? where id = ? and status = 'submitted'"
     [email hakemus-id])))

(defn update-loppuselvitys-status [hakemus-id status]
  (first (query-original-identifiers
          "update hakemukset set status_loppuselvitys = ? where id = ? and version_closed is null RETURNING *"
          [status hakemus-id])))

(defn update-valiselvitys-status [hakemus-id status]
  (first (query-original-identifiers
          "update hakemukset set status_valiselvitys = ? where id = ? and version_closed is null RETURNING *"
          [status hakemus-id])))

(defn set-selvitys-accepted [selvitys-type selvitys-email identity]
  (let [validated-email         (assoc selvitys-email :to (distinct (:to selvitys-email)))
        selvitys-hakemus-id     (:selvitys-hakemus-id selvitys-email)
        hakemus                 (get-hakemus selvitys-hakemus-id)
        avustushaku             (get-avustushaku (:avustushaku hakemus))
        is-jotpa-hakemus        (is-jotpa-avustushaku avustushaku)
        parent-id               (:parent_id hakemus)
        parent-hakemus          (get-hakemus parent-id)
        is-loppuselvitys        (= selvitys-type "loppuselvitys")
        is-verified             (= (:status_loppuselvitys parent-hakemus) "information_verified")
        verifier                (str (:first-name identity) " " (:surname identity))
        verifier-oid            (:person-oid identity)
        can-set-selvitys        (or (not is-loppuselvitys) is-verified)]
    (if can-set-selvitys
      (do
        (email/send-selvitys! (:to validated-email) hakemus (:subject validated-email) (:message validated-email) is-jotpa-hakemus)
        (update-selvitys-message validated-email)
        (if is-loppuselvitys
          (do
            (update-loppuselvitys-status parent-id "accepted")
            (execute!
             "UPDATE hakemukset
               SET
                 loppuselvitys_taloustarkastanut_oid = ?,
                 loppuselvitys_taloustarkastanut_name = ?,
                 loppuselvitys_taloustarkastettu_at = now()
               WHERE id = ? and version_closed is null"
             [verifier-oid verifier parent-id]))
          (update-valiselvitys-status parent-id "accepted"))
        true)
      false)))

(defn- roll-otantapolku []
  (let [prosentti (get-in config [:otantatarkastus :satunnaisotanta-prosentti])]
    (if (< (rand-int 100) prosentti)
      "satunnaisotanta"
      "otannan-ulkopuolella")))

(defn assign-loppuselvitys-otantapolku-if-enabled!
  "Called at loppuselvitys submission. No-op unless the haku has otantatarkastus
   enabled. Idempotent: skips when otantapolku is already set so täydennyspyyntö
   resubmission doesn't re-roll."
  [tx parent-hakemus-id]
  (let [hakemus (get-hakemus-by-id-tx tx parent-hakemus-id)
        avustushaku (get-avustushaku-tx tx (:avustushaku hakemus))]
    (when (and (:loppuselvitys_otantatarkastus_enabled avustushaku)
               (nil? (:loppuselvitys-otantapolku hakemus)))
      (execute!
       tx
       "UPDATE hakija.hakemukset
         SET loppuselvitys_otantapolku = ?
         WHERE id = ? AND version_closed IS NULL"
       [(roll-otantapolku) parent-hakemus-id]))))

(defn- save-checklist! [tx hakemus-id checklist]
  (execute!
   tx
   "INSERT INTO virkailija.loppuselvitys_asiatarkastus_checklist
    (hakemus_id, avustus_kaytetty_paatoksen_mukaisesti, omarahoitus_kaytetty,
     taloustiedot_kirjattu, avustus_alle_100k)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (hakemus_id) DO UPDATE SET
      avustus_kaytetty_paatoksen_mukaisesti = EXCLUDED.avustus_kaytetty_paatoksen_mukaisesti,
      omarahoitus_kaytetty = EXCLUDED.omarahoitus_kaytetty,
      taloustiedot_kirjattu = EXCLUDED.taloustiedot_kirjattu,
      avustus_alle_100k = EXCLUDED.avustus_alle_100k"
   [hakemus-id
    (:avustus-kaytetty-paatoksen-mukaisesti checklist)
    (:omarahoitus-kaytetty checklist)
    (:taloustiedot-kirjattu checklist)
    (:avustus-alle-100k checklist)]))

(defn- all-checklist-items-checked? [checklist]
  (and (:avustus-kaytetty-paatoksen-mukaisesti checklist)
       (:omarahoitus-kaytetty checklist)
       (:taloustiedot-kirjattu checklist)
       (:avustus-alle-100k checklist)))

(defn- verify-payload-shape!
  "Returns nil when payload matches the otantapolku, or a 400 response map when it doesn't."
  [otantapolku checklist email]
  (cond
    (and (nil? otantapolku) (or checklist email))
    {:error "2-vaiheinen path must not include checklist or email"}

    (and (= otantapolku "satunnaisotanta") (or checklist email))
    {:error "satunnaisotanta path must not include checklist or email"}

    (and (= otantapolku "otannan-ulkopuolella") (nil? checklist))
    {:error "otannan-ulkopuolella path requires checklist"}

    (and (= otantapolku "otannan-ulkopuolella")
         (all-checklist-items-checked? checklist)
         (nil? email))
    {:error "otannan-ulkopuolella + all checked requires email"}

    (and (= otantapolku "otannan-ulkopuolella")
         (not (all-checklist-items-checked? checklist))
         (some? email))
    {:error "otannan-ulkopuolella + risk path must not include email"}

    :else nil))

(defn verify-loppuselvitys-information [hakemus-id verify-information identity]
  (try
    (with-tx
      (fn [tx]
        (let [hakemus      (get-hakemus-by-id-tx tx hakemus-id)
              role         (get-avustushaku-role-by-avustushaku-id-and-person-oid-tx
                            tx (:avustushaku hakemus) (:person-oid identity))
              allowed?     (or (authorization/is-pääkäyttäjä? identity)
                               (authorization/is-valmistelija? role))
              status       (:status-loppuselvitys hakemus)
              haku-id      (:avustushaku-id hakemus)
              message      (:message verify-information)
              checklist    (:checklist verify-information)
              email-data   (:email verify-information)
              otantapolku (:loppuselvitys-otantapolku hakemus)
              verifier     (str (:first-name identity) " " (:surname identity))
              verifier-oid (:person-oid identity)
              avustushaku  (get-avustushaku-tx tx (:avustushaku hakemus))
              response-data {:loppuselvitys-information-verified-by verifier
                             :loppuselvitys-information-verification message
                             :otantapolku otantapolku}]
          (cond
            (not= status "submitted")
            (do (log/warn {:error "Status is not submitted"
                           :in "verify-loppuselvitys-information"
                           :hakemus-id hakemus-id
                           :haku-id haku-id})
                nil)

            (not allowed?)
            (do (log/warn {:error "User not allowed to verify"
                           :in "verify-loppuselvitys-information"
                           :hakemus-id hakemus-id
                           :haku-id haku-id})
                nil)

            :else
            (if-let [shape-err (verify-payload-shape! otantapolku checklist email-data)]
              (do (log/warn (assoc shape-err
                                   :in "verify-loppuselvitys-information"
                                   :hakemus-id hakemus-id
                                   :otantapolku otantapolku))
                  (bad-request shape-err))
              (cond
                ;; Path A: 2-vaiheinen (otanta off / submitted before feature)
                (nil? otantapolku)
                (do
                  (execute!
                   tx
                   "UPDATE hakemukset
                    SET status_loppuselvitys = 'information_verified',
                        loppuselvitys_information_verification = ?,
                        loppuselvitys_information_verified_by = ?,
                        loppuselvitys_information_verified_at = now()
                    WHERE id = ? AND version_closed IS NULL"
                   [message verifier hakemus-id])
                  (ok response-data))

                ;; Path B: satunnaisotanta — straight to information_verified
                (= otantapolku "satunnaisotanta")
                (do
                  (execute!
                   tx
                   "UPDATE hakemukset
                    SET status_loppuselvitys = 'information_verified',
                        loppuselvitys_information_verification = ?,
                        loppuselvitys_information_verified_by = ?,
                        loppuselvitys_information_verified_at = now()
                    WHERE id = ? AND version_closed IS NULL"
                   [message verifier hakemus-id])
                  (ok response-data))

                ;; Path C: otannan-ulkopuolella — branch on checklist outcome
                (= otantapolku "otannan-ulkopuolella")
                (let [all-checked (all-checklist-items-checked? checklist)]
                  (save-checklist! tx hakemus-id checklist)
                  (if all-checked
                    ;; C1: combo — accept + send email atomically
                    (do
                      (execute!
                       tx
                       "UPDATE hakemukset
                        SET status_loppuselvitys = 'accepted',
                            loppuselvitys_information_verification = ?,
                            loppuselvitys_information_verified_by = ?,
                            loppuselvitys_information_verified_at = now(),
                            loppuselvitys_taloustarkastanut_oid = ?,
                            loppuselvitys_taloustarkastanut_name = ?,
                            loppuselvitys_taloustarkastettu_at = now(),
                            loppuselvitys_riskiperusteinen = FALSE
                        WHERE id = ? AND version_closed IS NULL"
                       [message verifier verifier-oid verifier hakemus-id])
                      (let [selvitys-hakemus-id (:selvitys-hakemus-id email-data)
                            today-date (datetime/date-string (datetime/now))
                            email-json {:message (:message email-data)
                                        :subject (:subject email-data)
                                        :send today-date
                                        :to (distinct (:to email-data))}]
                        (execute!
                         tx
                         "UPDATE hakija.hakemukset SET selvitys_email = ? WHERE id = ? AND status = 'submitted'"
                         [email-json selvitys-hakemus-id])
                        (let [selvitys-hakemus (get-hakemus selvitys-hakemus-id)
                              is-jotpa (is-jotpa-avustushaku avustushaku)]
                          (email/send-selvitys! (distinct (:to email-data))
                                                selvitys-hakemus
                                                (:subject email-data)
                                                (:message email-data)
                                                is-jotpa)))
                      (ok response-data))
                    ;; C2: risk — set riskiperusteinen, route to taloustarkastus
                    (do
                      (execute!
                       tx
                       "UPDATE hakemukset
                        SET status_loppuselvitys = 'information_verified',
                            loppuselvitys_information_verification = ?,
                            loppuselvitys_information_verified_by = ?,
                            loppuselvitys_information_verified_at = now(),
                            loppuselvitys_riskiperusteinen = TRUE
                        WHERE id = ? AND version_closed IS NULL"
                       [message verifier hakemus-id])
                      (ok response-data))))))))))
    (catch java.sql.BatchUpdateException e
      (log/warn {:error (ex-message (ex-cause e))
                 :in "verify-loppuselvitys-information"
                 :hakemus-id hakemus-id})
      (conflict!))))

(defn get-hakemusdata [hakemus-id]
  (let [hakemus (first (query-original-identifiers
                        "select *, s.answers->'value' as answer_values
                          from hakija.hakemukset h
                            join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
                          where h.id = ? and h.version_closed is null"
                        [hakemus-id]))
        avustushaku-id (:avustushaku hakemus)
        avustushaku (get-avustushaku avustushaku-id)
        form (get-form-by-avustushaku avustushaku-id)
        roles (get-avustushaku-roles avustushaku-id)]
    {:avustushaku (avustushaku-response-content avustushaku)
     :roles       roles
     :form        (form->json form)
     :hakemus     (hakemus->json hakemus)}))

(defn list-attachments [hakemus-id]
  (query-original-identifiers
   "select id, version, hakemus_id, hakemus_version, created_at, field_id, filename, file_size, content_type
     from attachments
     where hakemus_id = ? and version_closed is null"
   [hakemus-id]))

(defn list-valiselvitys-hakemus-ids [avustushaku_id]
  (query-original-identifiers
   "select h.id, h.user_key
     from hakija.hakemukset h
     where h.avustushaku = ?
           and h.status != 'cancelled'
           and h.status != 'draft'
           and h.status_valiselvitys = 'missing'
           and h.status != 'new'
           and h.version_closed is null
           and h.hakemus_type='hakemus'
           and h.refused is not true
           and h.keskeytetty_aloittamatta is null"
   [avustushaku_id]))

(defn list-loppuselvitys-hakemus-ids [avustushaku_id]
  (query-original-identifiers
   "select h.id, h.user_key
     from hakija.hakemukset h
     where h.avustushaku = ?
           and h.status != 'cancelled'
           and h.status != 'draft'
           and h.status_loppuselvitys = 'missing'
           and h.status != 'new'
           and h.version_closed is null
           and h.hakemus_type='hakemus'
           and h.refused is not true
           and h.keskeytetty_aloittamatta is null"
   [avustushaku_id]))

(defn list-attachment-versions [hakemus-id]
  (query-original-identifiers
   "select id, version, hakemus_id, hakemus_version, created_at, field_id, filename, file_size, content_type
     from attachments
     where hakemus_id = ?"
   [hakemus-id]))

(defn attachment-exists? [hakemus-id field-id]
  (first (query-original-identifiers
          "select 1 from attachments where hakemus_id = ? and field_id = ?"
          [hakemus-id field-id])))

(defn- query-attachment [hakemus-id field-id attachment-version]
  (if attachment-version
    (query-original-identifiers
     "select file_size, content_type, filename, file_data from attachments
       where hakemus_id = ? and field_id = ? and version = ?"
     [hakemus-id field-id attachment-version])
    (query-original-identifiers
     "select file_size, content_type, filename, file_data from attachments
       where hakemus_id = ? and field_id = ? and version_closed is null"
     [hakemus-id field-id])))

(defn download-attachment [hakemus-id field-id attachment-version]
  (let [result (->> (query-attachment hakemus-id field-id attachment-version)
                    first)]
    {:data (io/input-stream (:file_data result))
     :content-type (:content_type result)
     :filename (:filename result)
     :size (:file_size result)}))

(defn create-form! [form-content created-at]
  (let [created-at-str (datetime/datetime->str created-at)]
    (first (query-original-identifiers
            "INSERT INTO forms (content, rules, created_at, updated_at)
              VALUES (?, ?, ?::timestamptz, ?::timestamptz) RETURNING *"
            [(:content form-content) (:rules form-content)
             created-at-str created-at-str]))))

(defn update-form-by-avustushaku [avustushaku-id form]
  (let [form-id (-> avustushaku-id
                    (get-form-by-avustushaku)
                    :id)
        form-to-save (assoc form :id form-id)]
    (try (with-tx (fn [tx] (update-form! tx form-to-save)
                    (upsert-menoluokka-rows tx avustushaku-id form-to-save)))
         (catch Exception e (throw (get-next-exception-or-original e))))
    (get-form-by-avustushaku avustushaku-id)))

(defn update-avustushaku-form-loppuselvitys [avustushaku-id form-id]
  (execute! "update avustushaut set form_loppuselvitys = ? where id = ?"
            [form-id avustushaku-id]))

(defn update-avustushaku-form-valiselvitys [avustushaku-id form-id]
  (execute! "update avustushaut set form_valiselvitys = ? where id = ?"
            [form-id avustushaku-id]))

(defn create-form [form-content created-at]
  (let [form (create-form! form-content created-at)
        form-id (:id form)]
    (get-form-by-id form-id)))

(defn update-form  [form-id form]
  (let [form-to-save (assoc form :id form-id)]
    (try (with-tx (fn [tx] (update-form! tx form-to-save)))
         (catch Exception e (throw (get-next-exception-or-original e))))
    (get-form-by-id form-id)))

(defn update-hakemus-status [hakemus status status-comment identity]
  (with-tx (fn [tx]
             (let [new-hakemus (hakemus-copy/create-new-hakemus-version tx (:id hakemus))
                   updated-hakemus (merge hakemus {:status (keyword status)
                                                   :version (:version new-hakemus)
                                                   :status_change_comment status-comment
                                                   :user_oid (:person-oid identity)
                                                   :user_first_name (:first-name identity)
                                                   :user_last_name (:surname identity)
                                                   :user_email (:email identity)
                                                   :avustushaku_id (:avustushaku hakemus)})]

               (first (named-query tx
                                   "UPDATE hakemukset
                         SET avustushaku = :avustushaku_id, user_key = :user_key,
                         form_submission_id = :form_submission_id,
                         form_submission_version = :form_submission_version,
                         budget_total = :budget_total, budget_oph_share = :budget_oph_share,
                         organization_name = :organization_name, project_name = :project_name,
                         language = :language, register_number = :register_number,
                         user_oid = :user_oid, user_first_name = :user_first_name,
                         user_last_name = :user_last_name, user_email = :user_email,
                         status = :status, status_change_comment = :status_change_comment,
                         last_status_change_at = now()
                         WHERE user_key = :user_key AND form_submission_id = :form_submission_id
                         AND version_closed IS NULL AND version = :version
                         RETURNING *"
                                   updated-hakemus))))))

(defn find-matching-hakemukset-by-organization-name [organization-name]
  (let [org-pattern (str "%" (escape-like-pattern organization-name) "%")]
    (query-original-identifiers
     "select id, version, avustushaku, created_at, status, organization_name, project_name,
              register_number, budget_total, budget_oph_share
       from hakemukset
       where organization_name ilike ?
             and version_closed is null
             and status in ('submitted', 'pending_change_request', 'officer_edit')
       order by organization_name, project_name"
     [org-pattern])))

(defn list-matching-avustushaut-by-ids [ids]
  (query-original-identifiers
   (str "select id, created_at,
                 content->'name' as name,
                 json_build_object('start', content#>>'{duration,start}', 'end', content#>>'{duration,end}')::jsonb as duration,
                 status, register_number
          from avustushaut
          where id in (" (in-list-placeholders (count ids)) ")
          order by content#>>'{duration,end}' desc, content#>>'{duration,start}' desc")
   (vec ids)))

(defn listing-avustushaku [avustushakudata]
  (let [avustushaku (avustushaku-response-content avustushakudata)]
    (assoc avustushaku
           :vastuuvalmistelija (:vastuuvalmistelija avustushakudata)
           :paatokset-lahetetty (:paatokset_lahetetty avustushakudata)
           :maksatukset-lahetetty (:maksatukset_lahetetty avustushakudata)
           :valiselvitykset-lahetetty (:valiselvitykset_lahetetty avustushakudata)
           :loppuselvitykset-lahetetty (:loppuselvitykset_lahetetty avustushakudata)
           :arvioitu_maksupaiva (:arvioitu_maksupaiva avustushakudata)
           :maksatukset-summa (:maksatukset_summa avustushakudata)
           :use-overridden-detailed-costs (:use_overridden_detailed_costs avustushakudata))))

(defn get-avustushaut-for-haku-listing []
  (let [data (query-original-identifiers
              "WITH avustushakus AS (
                  SELECT id AS avustushaku_id, *
                  FROM hakija.avustushaut
                  WHERE status <> 'deleted'
                ),
                vastuuvalmistelijat AS (
                  SELECT avustushaku AS avustushaku_id, name AS vastuuvalmistelija
                  FROM hakija.avustushaku_roles
                  WHERE avustushaku IN (SELECT id FROM avustushakus) AND
                        hakija.avustushaku_roles.role = 'vastuuvalmistelija'
                ),
                paatokset_lahetetty AS (
                  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS paatokset_lahetetty
                  FROM virkailija.tapahtumaloki
                  WHERE tapahtumaloki.avustushaku_id IN (SELECT id FROM avustushakus) AND
                        success AND tapahtumaloki.tyyppi = 'paatoksen_lahetys'
                  GROUP BY avustushaku_id
                ),
                maksatukset_lahetetty AS (
                  SELECT hakemus_version.avustushaku AS avustushaku_id,
                         min(payments.created_at) AS maksatukset_lahetetty
                  FROM hakija.hakemukset hakemus_version
                  JOIN virkailija.payments ON hakemus_version.id = payments.application_id
                       AND hakemus_version.version = payments.application_version
                  WHERE hakemus_version.avustushaku IN (SELECT id FROM avustushakus) AND
                        payments.deleted is NULL AND payments.paymentstatus_id = 'sent'
                  GROUP BY hakemus_version.avustushaku
                ),
                maksatukset_summa AS (
                  SELECT hakemus_version.avustushaku AS avustushaku_id,
                         coalesce(sum(payment_sum), 0) AS maksatukset_summa
                  FROM hakija.hakemukset hakemus_version
                  JOIN virkailija.payments ON hakemus_version.id = payments.application_id
                       AND hakemus_version.version = payments.application_version
                  WHERE hakemus_version.avustushaku IN (SELECT id FROM avustushakus) AND
                        payments.version_closed is NULL AND
                        payments.paymentstatus_id IN ('sent', 'paid')
                  GROUP BY hakemus_version.avustushaku
                ),
                valiselvityspyynnot_lahetetty AS (
                  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS valiselvitykset_lahetetty
                  FROM virkailija.tapahtumaloki
                  WHERE avustushaku_id IN (SELECT id FROM avustushakus) AND
                        success AND tapahtumaloki.tyyppi = 'valiselvitys-notification'
                  GROUP BY avustushaku_id
                ),
                loppuselvityspyynnot_lahetetty AS (
                  SELECT avustushaku_id, min(tapahtumaloki.created_at) AS loppuselvitykset_lahetetty
                  FROM virkailija.tapahtumaloki
                  WHERE avustushaku_id IN (SELECT id FROM avustushakus) AND
                        success AND tapahtumaloki.tyyppi = 'loppuselvitys-notification'
                  GROUP BY avustushaku_id
                ),
                use_detailed_costs AS (
                  SELECT DISTINCT ON (h.avustushaku)
                    h.avustushaku as avustushaku_id,
                    a.use_overridden_detailed_costs
                  FROM hakija.hakemukset h
                  JOIN virkailija.arviot a ON a.hakemus_id = h.id
                  WHERE h.avustushaku IN (SELECT id FROM avustushakus) AND
                        h.version_closed IS NULL AND a.status = 'accepted'
                )
                SELECT avustushaku.*, vastuuvalmistelija, paatokset_lahetetty,
                       maksatukset_lahetetty, valiselvitykset_lahetetty,
                       loppuselvitykset_lahetetty, maksatukset_summa,
                       use_overridden_detailed_costs
                FROM avustushakus avustushaku
                LEFT JOIN vastuuvalmistelijat USING (avustushaku_id)
                LEFT JOIN paatokset_lahetetty USING (avustushaku_id)
                LEFT JOIN maksatukset_lahetetty USING (avustushaku_id)
                LEFT JOIN maksatukset_summa USING (avustushaku_id)
                LEFT JOIN valiselvityspyynnot_lahetetty USING (avustushaku_id)
                LEFT JOIN loppuselvityspyynnot_lahetetty USING (avustushaku_id)
                LEFT JOIN use_detailed_costs USING (avustushaku_id)
                ORDER BY to_date(avustushaku.content#>>'{duration,start}','yyyy-MM-ddTHH24:MI:SS.MS') DESC,
                         avustushaku.id DESC"
              [])]
    (map listing-avustushaku data)))
