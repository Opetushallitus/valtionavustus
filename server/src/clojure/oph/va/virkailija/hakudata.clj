(ns oph.va.virkailija.hakudata
  (:require [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.scoring :as scoring]
            [oph.soresu.common.db]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.virkailija.va-code-values-data :as va-code-values]
            [oph.va.routes :as va-routes]
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
   :allow-visibility-in-external-system (:allow_visibility_in_external_system arvio)
   :should-pay (:should_pay arvio)
   :should-pay-comments (:should_pay_comments arvio)})

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
                           :allow-visibility-in-external-system false
                           :should-pay true})))

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
        arvio (virkailija-db/get-arvio (:id hakemus))]
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

(defn- add-talousarvio [avustushaku-id haku-data]
  (assoc haku-data :talousarvio (virkailija-db/get-menoluokkas avustushaku-id)))

(defn get-combined-avustushaku-data [avustushaku-id]
  (when-let [avustushaku (hakija-api/get-hakudata avustushaku-id)]
    (->> avustushaku
         add-arviot
         (add-talousarvio avustushaku-id)
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

(defn get-hakudata-for-export [avustushaku-id]
  (let [avustushaku        (hakija-api/get-avustushaku avustushaku-id)
        form               (hakija-api/form->json (hakija-api/get-form-by-avustushaku avustushaku-id))
        hakemukset         (hakija-api/get-hakemukset-for-export "hakemus" avustushaku-id)
        form-väliselvitys  (hakija-api/form->json (hakija-api/get-form-by-id (:form_valiselvitys avustushaku)))
        väliselvitykset    (hakija-api/get-hakemukset-for-export "valiselvitys" avustushaku-id)
        form-loppuselvitys (hakija-api/form->json (hakija-api/get-form-by-id (:form_loppuselvitys avustushaku)))
        loppuselvitykset   (hakija-api/get-hakemukset-for-export "loppuselvitys" avustushaku-id)
        arviot             (get-arviot-map hakemukset)
        scores             (scoring/get-avustushaku-scores avustushaku-id)]
    {:avustushaku        (va-routes/avustushaku-response-content avustushaku)
     :form               form
     :hakemukset         (map (fn [h]
                                (->> h
                                     (find-and-add-arvio arviot)
                                     (add-scores-to-hakemus scores)))
                              hakemukset)
     :form_väliselvitys  form-väliselvitys
     :väliselvitykset    väliselvitykset
     :form_loppuselvitys form-loppuselvitys
     :loppuselvitykset   loppuselvitykset}))

(defn get-avustushaku-and-paatokset
  [avustushaku-id]
  (let [avustushaku-combined (get-combined-avustushaku-data avustushaku-id)
        avustushaku (:avustushaku avustushaku-combined)
        avustushaku-simple {:nimi (-> avustushaku :content :name :fi)
                            :nimi_sv (-> avustushaku :content :name :sv)
                            :alkoi (-> avustushaku :content :duration :start)
                            :loppui (-> avustushaku :content :duration :end)}
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
                                 (assoc :ispublic true)))))

(defn get-toimintayksikko [id]
  (when (some? id)
    (va-code-values/get-va-code-value id)))

(defn get-combined-avustushaku-data-with-privileges [avustushaku-id identity]
  (when-let [haku-data (get-combined-avustushaku-data avustushaku-id)]
    (let [toimintayksikko-id (get-in haku-data [:avustushaku :operational-unit-id])
          toimintayksikko (get-toimintayksikko toimintayksikko-id)
          with-privileges (add-privileges identity haku-data)]
      (assoc with-privileges :toimintayksikko toimintayksikko))))

(defn- add-copy-suffixes [nameField]
  {:fi (str (:fi nameField) " (kopio)")
   :sv (str (:sv nameField) " (kopia)")})

(defn create-new-avustushaku [tx base-haku-id identity]
  (let [created-at (clj-time/now)
        base-haku (-> base-haku-id
                      (hakija-api/get-hakudata)
                      :avustushaku)
        {:keys [name selection-criteria self-financing-percentage focus-areas]} (:content base-haku)
        haku-type (:haku-type base-haku)
        form-id (:form base-haku)
        decision (merge (dissoc (:decision base-haku) :liitteet) {:updatedAt created-at})
        operational-unit-id (:operational-unit-id base-haku)
        avustushaku (hakija-api/get-avustushaku base-haku-id)
        loppuselvitys-id (:form_loppuselvitys avustushaku)
        valiselvitys-id (:form_valiselvitys avustushaku)
        muutoshakukelpoinen true
        new-haku (hakija-api/create-avustushaku
                  tx
                  {:name (add-copy-suffixes name)
                   :duration {:start (clj-time/plus created-at (clj-time/months 1))
                              :end (clj-time/plus created-at (clj-time/months 2))
                              :label {:fi "Hakuaika"
                                      :sv "Ansökningstid"}}
                   :selection-criteria selection-criteria
                   :self-financing-percentage self-financing-percentage
                   :focus-areas focus-areas}
                  form-id
                  loppuselvitys-id
                  valiselvitys-id
                  decision
                  haku-type
                  operational-unit-id
                  muutoshakukelpoinen
                  created-at)]
    (hakija-api/create-avustushaku-role tx
                                        {:avustushaku (:id new-haku)
                                         :role "vastuuvalmistelija"
                                         :name (str (:first-name identity) " "
                                                    (:surname identity))
                                         :email (:email identity)
                                         :oid (:person-oid identity)})
    (virkailija-db/copy-menoluokka-rows tx base-haku-id (:id new-haku))
    new-haku))
