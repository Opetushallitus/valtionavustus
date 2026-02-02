(ns oph.va.virkailija.hakemus-routes
  (:require [clojure.tools.logging :as log]
            [compojure.api.sweet :as compojure-api]
            [oph.soresu.common.db :refer [with-tx]]
            [oph.common.email :as common-email :refer [smtp-config]]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.schema :as va-schema]
            [oph.va.virkailija.authentication :as authentication]
            [oph.va.virkailija.authorization :as authorization]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.hakija.db :as hakija-db]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.va.virkailija.paatos :as paatos]
            [oph.va.virkailija.projects :as projects]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.scoring :as scoring]
            [oph.va.virkailija.tapahtumaloki :as tapahtumaloki]
            [ring.util.http-response :as http]
            [oph.va.hakija.jotpa :refer [is-jotpa-avustushaku]]
            [clojure.string]
            [schema.core :as s]))

(defn- notEmptyString [x] (not (clojure.string/blank? x)))

(defn- get-hakemus-and-its-avustushaku [avustushaku-id hakemus-id]
  (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
        hakemus (hakija-api/get-hakemus hakemus-id)]
    (cond
      (not hakemus) (http/not-found!)
      (not (= (:id avustushaku) (:avustushaku hakemus))) (http/bad-request!)
      :else {:avustushaku avustushaku :hakemus hakemus})))

(defn- get-hakemus-and-its-published-avustushaku [avustushaku-id hakemus-id]
  (let [{:keys [avustushaku] :as hakemus-and-avustushaku} (get-hakemus-and-its-avustushaku avustushaku-id hakemus-id)]
    (if (= "published" (:status avustushaku))
      hakemus-and-avustushaku
      (http/method-not-allowed!))))

(defn- map-email-field-value [field]
  (map :value (filter #(formutil/has-field-type? "vaEmailNotification" %) field)))

(defn- can-make-muutospaatos? [identity hakemus-id]
  (let [valmistelija (hakija-db/get-valmistelija-assigned-to-hakemus hakemus-id)
        user-oid (:person-oid identity)
        valmistelija-oid (:oid valmistelija)]
    (or (authorization/is-pääkäyttäjä? identity)
        (and valmistelija-oid (= user-oid valmistelija-oid)))))

(defn- cancel-taydennyspyynto [hakemus identity]
  (hakija-api/update-hakemus-status hakemus "submitted" "Täydennyspyyntö peruttu" identity)
  (http/ok {:status "ok"}))

(compojure-api/defroutes hakemus-routes
  (compojure-api/GET "/project" [haku-id hakemus-id]
    :path-params [avustushaku-id :- Long hakemus-id :- Long]
    :return (s/maybe virkailija-schema/VACodeValue)
    :summary "Get selected hakemus project"
    (http/ok (projects/get-project hakemus-id)))

  (compojure-api/GET "/muutoshakemus/" [hakemus-id]
    :path-params [hakemus-id :- Long]
    :return  va-schema/MuutoshakemusList
    :summary "Get muutoshakemukset"
    (http/ok (virkailija-db/get-muutoshakemukset hakemus-id)))
  (compojure-api/POST "/muutoshakemus/:muutoshakemus-id/paatos" request
    :path-params [avustushaku-id :- Long hakemus-id :- Long muutoshakemus-id :- Long]
    :body [paatos (compojure-api/describe virkailija-schema/MuutoshakemusPaatosRequest "Muutoshakemus paatos")]
    :return va-schema/MuutoshakemusList
    :summary "Create a paatos for muutoshakemus"
    (let [identity (authentication/get-request-identity request)]
      (when-not (can-make-muutospaatos? identity hakemus-id)
        (http/forbidden! {:error "Vain hankkeelle osoitettu valmistelija tai pääkäyttäjä voi tehdä muutospäätöksen"}))
      (let [{:keys [avustushaku hakemus]} (get-hakemus-and-its-avustushaku avustushaku-id hakemus-id)
            roles (hakija-api/get-avustushaku-roles avustushaku-id)
            arvio (virkailija-db/get-arvio hakemus-id)
            normalized-hakemus (virkailija-db/get-normalized-hakemus hakemus-id)
            contact-email (:contact-email normalized-hakemus)
            trusted-contact-email (:trusted-contact-email normalized-hakemus)
            to (remove nil? [contact-email trusted-contact-email])
            decider (str (:first-name identity) " " (:surname identity))
            paatos (virkailija-db/create-muutoshakemus-paatos muutoshakemus-id paatos decider avustushaku-id)
            token (virkailija-db/create-application-token (:id hakemus))]
        (email/send-muutoshakemus-paatos to avustushaku hakemus arvio roles token muutoshakemus-id paatos)
        (http/ok (virkailija-db/get-muutoshakemukset hakemus-id)))))

  (compojure-api/POST "/project" [avustushaku-id hakemus-id]
    :path-params [avustushaku-id :- Long hakemus-id :- Long]
    :body [project-body (compojure-api/describe virkailija-schema/VACodeValue "Hakemuksen projekti")]
    :return s/Any
    (http/ok (projects/update-project hakemus-id project-body)))

  (compojure-api/GET "/selvitys" request
    :path-params [hakemus-id :- Long avustushaku-id :- Long]
    :return s/Any
    :summary "Return all relevant selvitys data including answers, form and attachments"
    (if-let [response (hakija-api/get-selvitysdata avustushaku-id hakemus-id)]
      (http/ok response)
      (http/not-found)))

  (compojure-api/POST "/loppuselvitys/verify-information" request
    :path-params [avustushaku-id :- Long hakemus-id :- Long]
    :body [verify-information {:message s/Str}]
    :return s/Any
    :summary "Set loppuselvitys information verified"
    (let [identity (authentication/get-request-identity request)
          response (hakija-api/verify-loppuselvitys-information hakemus-id verify-information identity)]
      (if (nil? response)
        (http/bad-request!)
        response)))

  (compojure-api/GET "/tapahtumaloki/:tyyppi" []
    :path-params [avustushaku-id :- Long, hakemus-id :- Long, tyyppi :- s/Str]
    :return virkailija-schema/HakemusTapahtumaloki
    :summary "Get specific hakemus tapahtumaloki"
    (http/ok (tapahtumaloki/get-hakemus-tapahtumaloki-entries tyyppi avustushaku-id hakemus-id)))

  (compojure-api/POST
    "/send-email/:email-type-str" request
    :path-params [avustushaku-id :- Long
                  hakemus-id :- Long
                  email-type-str :- (s/enum "loppuselvitys-muistutus" "vapaa-viesti")]
    :body [{:keys [body subject to lang]} {:lang s/Str
                                           :body s/Str
                                           :subject s/Str
                                           :to [s/Str]}]
    :summary "Send email to hakija"
    (let [identity (authentication/get-request-identity request)
          email-type (keyword email-type-str)]
      (when (not (seq (filter notEmptyString to)))
        (http/bad-request! {:error "Viestillä on oltava vähintään yksi vastaanottaja"}))
      (let [is-jotpa-avustushaku (is-jotpa-avustushaku (hakija-api/get-avustushaku avustushaku-id))
            from (if is-jotpa-avustushaku (-> smtp-config :jotpa-from :fi) (-> smtp-config :from (get (keyword lang))))
            email-id (common-email/try-send-email!
                      (common-email/message (keyword lang)
                                            email-type
                                            to
                                            subject
                                            body
                                            {:reply-to (:email identity)})
                      {:hakemus-id     hakemus-id
                       :avustushaku-id avustushaku-id
                       :from           from})]
        (tapahtumaloki/create-log-entry email-type-str avustushaku-id hakemus-id identity "" {} email-id true))
      (http/created)))

  (compojure-api/POST
    "/loppuselvitys/taydennyspyynto" request
    :path-params [avustushaku-id :- Long hakemus-id :- Long]
    :body [{:keys [body subject to type  lang]} {:lang s/Str
                                                 :body s/Str
                                                 :subject s/Str
                                                 :type (s/enum "taydennyspyynto-asiatarkastus" "taydennyspyynto-taloustarkastus")
                                                 :to [s/Str]}]
    :return s/Any
    :summary "Send taydennyspyynto to hakija"
    (let [identity (authentication/get-request-identity request)]
      (when (not (seq (filter notEmptyString to)))
        (http/bad-request! {:error "Viestillä on oltava vähintään yksi vastaanottaja"}))
      (let [loppuselvitys-hakemus-id (hakija-db/get-loppuselvitys-hakemus-id hakemus-id)
            loppuselvitys-hakemus (hakija-api/get-hakemus loppuselvitys-hakemus-id)]
        (hakija-api/update-hakemus-status loppuselvitys-hakemus "pending_change_request" "Täydennyspyyntö kts. sähköposti" identity))
      (let [is-jotpa-avustushaku (is-jotpa-avustushaku (hakija-api/get-avustushaku avustushaku-id))
            from (if is-jotpa-avustushaku (-> smtp-config :jotpa-from :fi) (-> smtp-config :from (get (keyword lang))))
            email-id (common-email/try-send-email!
                      (common-email/message (keyword lang)
                                            (keyword type)
                                            to
                                            subject
                                            body
                                            {:reply-to (:email identity)})
                      {:hakemus-id     hakemus-id
                       :avustushaku-id avustushaku-id
                       :from           from})]
        (log/info (str "Sent with reply-to address " (:email identity)))
        (tapahtumaloki/create-log-entry type avustushaku-id hakemus-id identity "" {} email-id true))
      (http/created)))

  (compojure-api/PUT "/loppuselvitys/cancel-taydennyspyynto" [avustushaku-id hakemus-id :as request]
    :path-params [avustushaku-id :- Long, hakemus-id :- Long]
    :return s/Any
    :summary "Cancel täydennyspyynto"
    (let [identity (authentication/get-request-identity request)
          loppuselvitys-hakemus-id (hakija-db/get-loppuselvitys-hakemus-id hakemus-id)
          loppuselvitys-hakemus (hakija-api/get-hakemus loppuselvitys-hakemus-id)]
      (if (= "pending_change_request" (:status loppuselvitys-hakemus))
        (cancel-taydennyspyynto loppuselvitys-hakemus identity)
        (http/bad-request!))))

  (compojure-api/POST "/re-send-paatos" request
    :path-params [avustushaku-id :- Long hakemus-id :- Long]
    :return s/Any
    :summary "Re-sends paatos emails"
    (log/info  (str "Re-send emails for application " hakemus-id))
    (paatos/re-send-paatos-email
     hakemus-id (.toString (java.util.UUID/randomUUID)) (authentication/get-request-identity request)))

  (compojure-api/POST "/arvio" request
    :path-params [avustushaku-id :- Long hakemus-id :- Long]
    :body [arvio (compojure-api/describe virkailija-schema/Arvio "New arvio")]
    :return virkailija-schema/Arvio
    :summary "Update arvio for given hakemus. Creates arvio if missing."
    (if-let [avustushaku (hakija-api/get-avustushaku avustushaku-id)]
      (let [identity (authentication/get-request-identity request)]
        (http/ok (-> (virkailija-db/update-or-create-hakemus-arvio avustushaku hakemus-id arvio identity)
                     hakudata/arvio-json)))
      (http/not-found)))

  (compojure-api/PUT "/keskeyta-aloittamatta"
    request
    :path-params [avustushaku-id :- Long hakemus-id :- Long]
    :return s/Any
    :body [body virkailija-schema/KeskeytaAloittamattaBody]
    (with-tx (fn [tx]
               (if (:keskeyta body)
                 (hakija-db/refuse-application tx hakemus-id "Keskeytetty aloittamatta")
                 (hakija-db/unrefuse-application tx hakemus-id))
               (virkailija-db/keskeyta-aloittamatta tx hakemus-id (:keskeyta body))
               (http/ok (hakija-db/get-hakemus-by-id-tx tx hakemus-id)))))

  (compojure-api/GET "/comments" []
    :path-params [avustushaku-id :- Long, hakemus-id :- Long]
    :return virkailija-schema/Comments
    :summary "Get current comments for hakemus"
    (http/ok (virkailija-db/list-comments hakemus-id)))

  (compojure-api/POST "/comments" request
    :path-params [avustushaku-id :- Long, hakemus-id :- Long]
    :body [comment (compojure-api/describe virkailija-schema/NewComment "New comment")]
    :return virkailija-schema/Comments
    :summary "Add a comment for hakemus. As response, return all comments"
    (let [identity (authentication/get-request-identity request)
          _avustushaku_and_hakemus_exists? (get-hakemus-and-its-published-avustushaku avustushaku-id hakemus-id)]
      (http/ok (virkailija-db/add-comment hakemus-id
                                          (:first-name identity)
                                          (:surname identity)
                                          (:email identity)
                                          (:comment comment)
                                          (:person-oid identity)))))
  (compojure-api/GET "/attachments" []
    :path-params [avustushaku-id :- Long, hakemus-id :- Long]
    :return s/Any
    :summary "List current attachments"
    :description "Listing does not return actual attachment data. Use per-field download for getting it."
    (http/ok (-> (hakija-api/list-attachments hakemus-id)
                 (hakija-api/attachments->map))))

  (compojure-api/GET "/attachments/versions" []
    :path-params [avustushaku-id :- Long, hakemus-id :- Long]
    :return [va-schema/Attachment]
    :summary "List all versions of attachments of given hakemus"
    :description "Listing does not return actual attachment data. Use per-field versioned download URL for getting it."
    (http/ok (->> (hakija-api/list-attachment-versions hakemus-id)
                  (map hakija-api/convert-attachment))))

  (compojure-api/GET "/attachments/:field-id" []
    :path-params [avustushaku-id :- Long, hakemus-id :- Long, field-id :- s/Str]
    :query-params [{attachment-version :- Long nil}]
    :summary "Download attachment attached to given field"
    (if (hakija-api/attachment-exists? hakemus-id field-id)
      (let [{:keys [data filename content-type]} (hakija-api/download-attachment hakemus-id field-id attachment-version)]
        (-> (http/ok data)
            (assoc-in [:headers "Content-Type"] content-type)
            (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" filename "\""))))
      (http/not-found)))

  (compojure-api/GET "/normalized" [haku-id hakemus-id]
    :path-params [avustushaku-id :- Long hakemus-id :- Long]
    :return  va-schema/NormalizedHakemus
    :summary "Get normalized answers"
    (if-let [normalized-hakemus (virkailija-db/get-normalized-hakemus hakemus-id)]
      (http/ok normalized-hakemus)
      (http/not-found)))

  (compojure-api/GET "/change-requests" []
    :path-params [avustushaku-id :- Long, hakemus-id :- Long]
    :return [virkailija-schema/Hakemus]
    :summary "List change requests of given hakemus"
    (hakija-api/list-hakemus-change-requests hakemus-id))

  (compojure-api/GET "/scores" []
    :path-params [avustushaku-id :- Long, hakemus-id :- Long]
    :return virkailija-schema/ScoringOfArvio
    :summary "Get scorings for given hakemus"
    :description "Scorings are linked to avustushaku focus areas"
    (if-let [arvio (virkailija-db/get-arvio hakemus-id)]
      (http/ok (scoring/get-arvio-scores avustushaku-id (:id arvio)))
      (http/ok {:scoring nil
                :scores []})))

  (compojure-api/POST "/scores" request
    :path-params [avustushaku-id :- Long, hakemus-id :- Long]
    :body [score (compojure-api/describe virkailija-schema/NewScore "Stored or updated score")]
    :return virkailija-schema/ScoringOfArvio
    :summary "Submit scorings for given arvio."
    :description "Scorings are automatically assigned to logged in user."
    (let [identity (authentication/get-request-identity request)
          _avustushaku_and_hakemus_exists? (get-hakemus-and-its-published-avustushaku avustushaku-id hakemus-id)]
      (http/ok (scoring/add-score avustushaku-id
                                  hakemus-id
                                  identity
                                  (:selection-criteria-index score)
                                  (:score score)))))

  (compojure-api/POST "/status" request
    :path-params [avustushaku-id :- Long, hakemus-id :- Long]
    :body [body {:status va-schema/HakemusStatus
                 :comment s/Str}]
    :return {:hakemus-id Long
             :status va-schema/HakemusStatus}
    :summary "Update status of hakemus"
    (let [{:keys [avustushaku hakemus]} (get-hakemus-and-its-avustushaku avustushaku-id hakemus-id)
          {new-status :status status-comment :comment} body
          identity (authentication/get-request-identity request)]
      (when (and (= "cancelled" new-status) (= "resolved" (:status avustushaku)))
        (http/method-not-allowed!))
      (let [updated-hakemus (hakija-api/update-hakemus-status hakemus new-status status-comment identity)]
        (when (= new-status "pending_change_request")
          (let [submission (hakija-api/get-hakemus-submission updated-hakemus)
                answers (:answers submission)
                language (keyword (or (formutil/find-answer-value answers "language") "fi"))
                avustushaku-name (-> avustushaku :content :name language)
                organisaatio-email (formutil/find-answer-value answers "organization-email")
                trusted-contact-email (formutil/find-answer-value answers "trusted-contact-email")
                allekirjoitusoikeudelliset (formutil/find-answer-value answers "signatories-fieldset")
                email (formutil/find-answer-value answers "primary-email")
                user-key (:user_key updated-hakemus)
                presenting-officer-email (:email identity)
                allekirjoitusomaavat (map #(map-email-field-value %) (map :value allekirjoitusoikeudelliset))
                cc (vec (remove nil? (conj (flatten allekirjoitusomaavat) organisaatio-email trusted-contact-email)))
                business-id (:business_id hakemus)]
            (email/send-taydennyspyynto-message! language email cc avustushaku hakemus-id avustushaku-name user-key status-comment presenting-officer-email business-id)))
        (when (= new-status "submitted")
          (virkailija-db/update-submitted-hakemus-version (:id hakemus)))
        (http/ok {:hakemus-id hakemus-id
                  :status new-status})))))
