(ns oph.va.virkailija.hakemus-search
  (:require [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.db :as virkailija-db]))

(defn- matching-hakemus->json [hakemus arvio]
  ; array-map for preserving iteration order
  (array-map :id                (:id hakemus)
             :version           (:version hakemus)
             :created-at        (:created_at hakemus)
             :status            (:status hakemus)
             :arvio_status      (:status arvio)
             :organization-name (:organization_name hakemus)
             :project-name      (:project_name hakemus)
             :register-number   (:register_number hakemus)
             :budget-total      (:budget_total hakemus)
             :budget-oph-share  (:budget_oph_share hakemus)
             :budget-granted    (:budget_granted arvio)))

(defn- matching-avustushaku->json [avustushaku]
  ; array-map for preserving iteration order
  (array-map :id              (:id avustushaku)
             :created-at      (:created_at avustushaku)
             :name            (:name avustushaku)
             :duration        (:duration avustushaku)
             :register-number (:register_number avustushaku)))

(defn- make-matching-avustushaku [avustushaku hakemukset arviot-by-hakemus-id]
  (letfn [(to-matching-hakemus [hakemus]
            (let [hakemus-id (:id hakemus)
                  arvio      (arviot-by-hakemus-id hakemus-id)]
              (matching-hakemus->json hakemus arvio)))]
    {:avustushaku               (matching-avustushaku->json avustushaku)
     :count-matching-hakemukset (count hakemukset)
     :matching-hakemukset       (map to-matching-hakemus hakemukset)}))

(defn- make-matching-avustushaut [avustushaut hakemukset-by-avustushaku-id arviot-by-hakemus-id]
  (letfn [(to-matching-avustushaku [avustushaku]
            (let [avustushaku-id (:id avustushaku)
                  hakemukset     (hakemukset-by-avustushaku-id avustushaku-id)]
              (make-matching-avustushaku avustushaku hakemukset arviot-by-hakemus-id)))]
    {:count-matching-avustushaut (count avustushaut)
     :matching-avustushaut       (map to-matching-avustushaku avustushaut)}))

(defn find-hakemukset-by-organization-name [organization-name]
  (let [hakemukset                   (hakija-api/find-matching-hakemukset-by-organization-name organization-name)
        arviot                       (virkailija-db/list-arvio-status-and-budget-granted-by-hakemus-ids (map :id hakemukset))
        arviot-by-hakemus-id         (reduce (fn [acc m] (assoc acc (:hakemus_id m) m)) {} arviot)
        hakemukset-by-avustushaku-id (group-by :avustushaku hakemukset)
        avustushaut                  (hakija-api/list-matching-avustushaut-by-ids (keys hakemukset-by-avustushaku-id))]
    (make-matching-avustushaut avustushaut hakemukset-by-avustushaku-id arviot-by-hakemus-id)))
