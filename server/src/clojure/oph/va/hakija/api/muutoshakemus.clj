(ns oph.va.hakija.api.muutoshakemus
  (:require
   [clojure.string :as str]
   [clojure.tools.logging :as log]
   [compojure.api.sweet :as compojure-api]
   [oph.va.hakija.db :as hakija-db]
   [oph.va.hakija.email :as va-email]
   [oph.va.hakija.schema :refer [MuutoshakemusPaatosDocument MuutoshakemusRequest]]
   [oph.va.schema :refer [NormalizedHakemus]]
   [ring.util.http-response :as http]
   [schema.core :as s]))

(defn- sum-normalized-hakemus-budget [hakemus]
  (when-let [talousarvio (:talousarvio hakemus)]
    (reduce (fn [sum menoluokka] (+ sum (:amount menoluokka))) 0 talousarvio)))

(defn- sum-muutoshakemus-budget [muutoshakemus]
  (when-let [talousarvio (:talousarvio muutoshakemus)]
    (reduce (fn [sum [type amount]] (+ sum amount)) 0 talousarvio)))

(defn- validate-muutoshakemus [user-key muutoshakemus]
  (let [muutoshakemus-budget (sum-muutoshakemus-budget muutoshakemus)
        hakemus (when muutoshakemus-budget (hakija-db/get-normalized-hakemus user-key))
        hakemus-budget (when hakemus (sum-normalized-hakemus-budget hakemus))]
    (when (and muutoshakemus-budget (not= hakemus-budget muutoshakemus-budget))
      [(str "muutoshakemus budget was " muutoshakemus-budget " (should be " hakemus-budget ")")])))

(defn- should-notify-valimistelija-of-new-muutoshakemus [muutoshakemus]
  (or (:talousarvio muutoshakemus)
      (get-in muutoshakemus [:jatkoaika :haenKayttoajanPidennysta])
      (get-in muutoshakemus [:sisaltomuutos :haenSisaltomuutosta])))

(defn- on-post-muutoshakemus [user-key muutoshakemus]
  (let [hakemus (hakija-db/get-hakemus user-key)
        avustushaku-id (:avustushaku hakemus)
        hakemus-id (:id hakemus)
        register-number (:register_number hakemus)
        normalized-hakemus (hakija-db/get-normalized-hakemus user-key)
        ;; Use organization-name as fallback when project-name is blank
        hanke (if (str/blank? (:project-name normalized-hakemus))
                (:organization-name normalized-hakemus)
                (:project-name normalized-hakemus))
        valmistelija-email (:email (hakija-db/get-valmistelija-assigned-to-hakemus hakemus-id))]
    (hakija-db/on-muutoshakemus user-key hakemus-id avustushaku-id muutoshakemus)
    (when (should-notify-valimistelija-of-new-muutoshakemus muutoshakemus)
      (if (nil? valmistelija-email)
        (log/info "Hakemus" hakemus-id "is missing valmistelija. Can't send notification of new muutoshakemus.")
        (va-email/notify-valmistelija-of-new-muutoshakemus [valmistelija-email] avustushaku-id register-number hanke hakemus-id)))
    (http/ok (hakija-db/get-normalized-hakemus user-key))))

(compojure-api/defroutes muutoshakemus-routes
  "APIs for hakemus changes after the hakemus has already been approved"

  (compojure-api/GET "/paatos/:user-key" [user-key]
    :path-params [user-key :- s/Str]
    :return MuutoshakemusPaatosDocument
    :summary "Get data for rendering a muutoshakemus paatos document"
    (let [paatos (hakija-db/get-paatos user-key)
          muutoshakemukset (hakija-db/get-muutoshakemukset-by-paatos-user-key user-key)
          muutoshakemus (first (filter #(= user-key (:paatos-user-key %)) muutoshakemukset))
          muutoshakemus-url (hakija-db/get-muutoshakemus-url-by-hakemus-id (:hakemus-id muutoshakemus))
          presenter (hakija-db/get-valmistelija-assigned-to-hakemus (:hakemus-id muutoshakemus))
          avustushaku (hakija-db/get-avustushaku-by-paatos-user-key user-key)
          hakemus (hakija-db/get-normalized-hakemus-by-id (:hakemus-id muutoshakemus))
          is-decided-by-ukotettu-valmistelija (= (:decider muutoshakemus)
                                                 (:name presenter))]
      (if (nil? paatos)
        (http/not-found)
        (http/ok {:paatos paatos
                  :muutoshakemus muutoshakemus
                  :muutoshakemusUrl muutoshakemus-url
                  :muutoshakemukset muutoshakemukset
                  :presenter {:name (:name presenter) :email (:email presenter)}
                  :isDecidedByUkotettuValmistelija is-decided-by-ukotettu-valmistelija
                  :avustushaku {:hankkeen-alkamispaiva (:hankkeen-alkamispaiva avustushaku) :hankkeen-paattymispaiva (:hankkeen-paattymispaiva avustushaku)}
                  :hakemus hakemus}))))

  (compojure-api/POST "/:user-key" [user-key :as request]
    :path-params [user-key :- s/Str]
    :return NormalizedHakemus
    :body [muutoshakemus (compojure-api/describe MuutoshakemusRequest "Application change request")]
    :summary "Apply for changes to application"
    (if-let [errors (validate-muutoshakemus user-key muutoshakemus)]
      (do
        (log/warn "error posting muutoshakemus with user key" user-key ":" errors)
        (http/bad-request))
      (on-post-muutoshakemus user-key muutoshakemus))))
