(ns oph.va.virkailija.hakudata
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.scoring :as scoring]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.authorization :as authorization]
            [clj-time.core :as clj-time]))

(defn arvio-json [arvio]
  {:id (:id arvio)
   :status (:status arvio)
   :overridden-answers (:overridden_answers arvio)
   :seuranta-answers (:seuranta_answers arvio)
   :budget-granted (:budget_granted arvio)
   :costsGranted (:costs_granted arvio)
   :useDetailedCosts (:use_overridden_detailed_costs arvio)
   :summary-comment (:summary_comment arvio)
   :presentercomment (:presentercomment arvio)
   :roles (:roles arvio)
   :presenter-role-id (:presenter_role_id arvio)
   :rahoitusalue (:rahoitusalue arvio)
   :talousarviotili (:talousarviotili arvio)
   :academysize (:academysize arvio)
   :perustelut (:perustelut arvio)
   :tags (:tags arvio)
   :oppilaitokset (:oppilaitokset arvio)
   :changelog (:changelog arvio)
   })


(defn- add-arvio [arvio hakemus]
  (if arvio
    (assoc hakemus :arvio arvio)
    (assoc hakemus :arvio {:id                 -1
                           :status             "unhandled"
                           :overridden-answers {:value []}
                           :seuranta-answers   {:value []}
                           :budget-granted     0
                           :costsGranted       0
                           :academysize 0
                           :useDetailedCosts   false
                           :roles              {:evaluators []}
                           :tags               {:value []}
                           :oppilaitokset      {:names []}
                           })))

(defn- find-and-add-arvio [arviot hakemus]
  (add-arvio (get arviot (:id hakemus)) hakemus))

(defn- get-arviot-map [hakemukset]
  (->> hakemukset
       (map :id)
       (virkailija-db/get-arviot)
       (map (fn [arvio] [(:hakemus_id arvio) (arvio-json arvio)]))
       (into {})))

(defn- add-arviot [haku-data]
  (let [hakemukset (:hakemukset haku-data)
        arviot (get-arviot-map hakemukset)
        budget-granted-sum (reduce + (map :budget-granted (vals arviot)))]
    (-> haku-data
        (assoc :hakemukset (map (partial find-and-add-arvio arviot) hakemukset))
        (assoc :budget-granted-sum budget-granted-sum))))

(defn- paatosdata-with-arvio [paatosdata]
  (let [hakemus (:hakemus paatosdata)
        arvio (virkailija-db/get-arvio (:id hakemus) )]
    (assoc paatosdata :hakemus (add-arvio (arvio-json arvio) hakemus))))

(defn- add-scores-to-hakemus [scores hakemus]
  (if-let [hakemus-scores (-> (fn [score-entry] (= (-> hakemus :arvio :id) (:arvio-id score-entry)))
                              (filter scores)
                              first)]
    (assoc-in hakemus [:arvio :scoring] hakemus-scores)
    hakemus))

(defn- add-scores [scores haku-data]
  (let [hakemukset (:hakemukset haku-data)]
    (-> haku-data
        (assoc :hakemukset (map (partial add-scores-to-hakemus scores) hakemukset)))))

(defn- add-privileges [user-identity haku-data]
  (let [person-oid     (:person-oid user-identity)
        user-haku-role (->> :roles
                            haku-data
                            (filter (fn [role] (= (:oid role) person-oid)))
                            first)]
    (assoc haku-data
           :privileges
           (authorization/resolve-user-privileges user-identity user-haku-role))))

(defn get-combined-avustushaku-data [avustushaku-id]
  (when-let [avustushaku (hakija-api/get-hakudata avustushaku-id)]
    (->> avustushaku
         add-arviot
         (add-scores (scoring/get-avustushaku-scores avustushaku-id)))))

(defn- hakemus->hakemus-simple [hakemus]
  (let [answers {:value (:answers hakemus)}
        paatos-status (-> hakemus :arvio :status)
        arvio-statuses {:unhandled "Käsittelemättä"
                        :processing "Käsittelyssä"
                        :plausible "Mahdollinen"
                        :rejected "Hylätty"
                        :accepted "Hyväksytty"}
        paatos-clear (get arvio-statuses (keyword paatos-status))]
    {:projektin_nimi (:project-name hakemus)
     :tavoitteet (formutil/find-answer-value answers "project-goals")
     :www_osoite (formutil/find-answer-value answers "project-www")
     :projekti_pahkinakuoressa (formutil/find-answer-value answers "project-nutshell")
     :organisaation_nimi (:organization-name hakemus)
     :budjetti_myonnetty (:budget-total hakemus)
     :diaarinumero (:register-number hakemus)
     :paatos paatos-clear
     :perustelut (-> hakemus :arvio :perustelut)}))


(defn get-avustushaku-and-paatokset
  [avustushaku-id]
  (let [avustushaku-combined (get-combined-avustushaku-data avustushaku-id)
        avustushaku (:avustushaku avustushaku-combined)
        avustushaku-simple {:nimi (-> avustushaku :content :name :fi)
                            :nimi_sv (-> avustushaku :content :name :sv)
                            :alkoi (-> avustushaku :content :duration :start)
                            :loppui (-> avustushaku :content :duration :end)
                            }
        hakemukset (:hakemukset avustushaku-combined)
        hakemukset-submitted (filter #(= "submitted" (:status %)) hakemukset)
        hakemukset-simple (mapv hakemus->hakemus-simple hakemukset-submitted)]
    {:avustushaku avustushaku-simple :hakemukset hakemukset-simple}))

(defn get-combined-paatos-data [hakemus-id]
    (when-let [paatosdata (hakija-api/get-hakemusdata hakemus-id)]
      (paatosdata-with-arvio paatosdata)))

(defn get-final-combined-paatos-data [hakemus-id]
  (let [combined (get-combined-paatos-data hakemus-id)
        status (-> combined :avustushaku :status)]
    (when (= status "resolved") (->
                                  combined
                                  (assoc :ispublic true)
                                  ))))

(defn get-combined-avustushaku-data-with-privileges [avustushaku-id identity]
  (when-let [haku-data (get-combined-avustushaku-data avustushaku-id)]
    (add-privileges identity haku-data)))

(defn- add-copy-suffixes [nameField]
  { :fi (str (:fi nameField) " (kopio)" )
    :sv (str (:sv nameField) " (kopia)")})

(defn presenting-officer-email [avustushaku-id]
  (let [roles (hakija-api/get-avustushaku-roles avustushaku-id)
        presenting-officers (filter (fn [x] (= (:role x) "presenting_officer")) roles)
        presenting-officer-emails (map :email presenting-officers)
        first-email (first presenting-officer-emails)] first-email))

(defn create-new-avustushaku [base-haku-id identity]
  (let [base-haku (-> base-haku-id
                      (hakija-api/get-hakudata)
                      :avustushaku)
        {:keys [name selection-criteria self-financing-percentage focus-areas
                operational-unit project operation]} (:content base-haku)
        haku-type (:haku-type base-haku)
        form-id (:form base-haku)
        decision (:decision base-haku)
        new-haku (hakija-api/create-avustushaku
                   {:name (add-copy-suffixes name)
                    :duration {:start (clj-time/plus
                                        (clj-time/now) (clj-time/months 1))
                               :end (clj-time/plus
                                      (clj-time/now) (clj-time/months 2))
                               :label {:fi "Hakuaika"
                                       :sv "Ansökningstid"}}
                    :selection-criteria selection-criteria
                    :self-financing-percentage self-financing-percentage
                    :focus-areas focus-areas
                    :operational-unit operational-unit
                    :project project
                    :operation operation}
                   form-id
                   decision
                   haku-type)]
    (hakija-api/create-avustushaku-role {:avustushaku (:id new-haku)
                                         :role "presenting_officer"
                                         :name (str (:first-name identity) " "
                                                    (:surname identity))
                                         :email (:email identity)
                                         :oid (:person-oid identity)})
    new-haku))
