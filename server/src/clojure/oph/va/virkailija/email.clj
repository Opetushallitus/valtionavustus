(ns oph.va.virkailija.email
  (:require [clojure.java.io :refer [copy input-stream resource]]
            [clojure.tools.logging :as log]
            [clojurewerkz.quartzite.jobs :refer [defjob] :as j]
            [clojurewerkz.quartzite.schedule.cron :refer [schedule cron-schedule]]
            [clojurewerkz.quartzite.scheduler :as qs]
            [clojurewerkz.quartzite.triggers :as t]
            [clostache.parser :refer [render]]
            [oph.common.datetime :as datetime]
            [oph.common.email :as email]
            [oph.soresu.common.config :refer [config]]
            [oph.soresu.common.db :refer [query]]
            [oph.va.decision-liitteet :refer [Liitteet]]
            [oph.va.virkailija.tapahtumaloki :as tapahtumaloki]))

(def mail-titles
  {:change-request {:fi "Täydennyspyyntö avustushakemukseesi"
                    :sv "Begäran om komplettering av ansökan"}
   :taydennyspyynto {:fi "Täydennyspyyntö avustushakemukseesi"
                     :sv "Begäran om komplettering av ansökan"}
   :paatos {:fi "Automaattinen viesti: organisaationne avustushakemus on käsitelty - Linkki päätösasiakirjaan"
            :sv "Automatiskt meddelande: Er ansökan om understöd har behandlats – Länk till beslutet"}
   :muutoshakemus-paatos {:fi "Automaattinen viesti: organisaationne muutoshakemus on käsitelty - Linkki päätösasiakirjaan"
            :sv "Automatiskt meddelande: Er ändringsansökan har behandlats - Länk till beslutet"}
   :selvitys {:fi "Väliselvitys käsitelty"
              :sv "Mellanredovisning behandlat"}
   :valiselvitys-notification {:fi "Väliselvitys täytettävissä haulle"
                               :sv "Mellanredovisningnen redo att fyllas"}
   :loppuselvitys-notification {:fi "Loppuselvitys täytettävissä haulle"
                                :sv "Slutredovisningen redo att fyllas"}
   :hakuaika-paattymassa {:fi "Hakuaika on päättymässä"
                          :sv "Ansökningstiden närmar sig sitt slut"}
   :hakuaika-paattynyt {:fi "Hakuaika on päättynyt"}
   :valiselvitys-palauttamatta {:fi "Muistutus väliselvityksen palauttamisesta"
                                :sv "Påminnelse om att lämna in mellanredovisningen"}
   :loppuselvitys-palauttamatta {:fi "Muistutus loppuselvityksen palauttamisesta"
                                 :sv "Påminnelse om att lämna in slutredovisningen"}
   :payments-info-notification
   {:fi "Automaattinen viesti - Valtionavustuserän '%s' maksatus suoritettu"
    :sv "Automatiskt meddelande - Statsunderstöd '%s' betald"}})

(def mail-templates
  {:change-request {:fi (email/load-template "email-templates/change-request.plain.fi")
                    :sv (email/load-template "email-templates/change-request.plain.sv")}
   :taydennyspyynto {:fi (email/load-template "email-templates/taydennyspyynto.plain.fi")
                     :sv (email/load-template "email-templates/taydennyspyynto.plain.sv")}
   :paatos {:fi (email/load-template "email-templates/paatos.plain.fi")
            :sv (email/load-template "email-templates/paatos.plain.sv")}
   :muutoshakemus-paatos {:fi (email/load-template "email-templates/muutoshakemus-paatos.plain.fi")
            :sv (email/load-template "email-templates/muutoshakemus-paatos.plain.sv")}
   :paatos-refuse
   {:fi (email/load-template "email-templates/paatos-refuse.plain.fi")
    :sv (email/load-template "email-templates/paatos-refuse.plain.sv")}
   :selvitys {:fi (email/load-template "email-templates/selvitys.plain.fi")
              :sv (email/load-template "email-templates/selvitys.plain.sv")}
   :valiselvitys-notification {:fi (email/load-template "email-templates/valiselvitys-notification.plain.fi")
                               :sv (email/load-template "email-templates/valiselvitys-notification.plain.sv")}
   :loppuselvitys-notification {:fi (email/load-template "email-templates/loppuselvitys-notification.plain.fi")
                                :sv (email/load-template "email-templates/loppuselvitys-notification.plain.sv")}
   :payments-info-notification
   {:fi (email/load-template "email-templates/payments-info.fi")
    :sv (email/load-template "email-templates/payments-info.fi")}
   :loppuselvitys-asiatarkastamatta (email/load-template "email-templates/loppuselvitys-asiatarkastamatta.fi")
   :loppuselvitys-taloustarkastamatta (email/load-template "email-templates/loppuselvitys-taloustarkastamatta.fi")
   :laheta-loppuselvityspyynnot (email/load-template "email-templates/laheta-loppuselvityspyynnot.fi")
   :valiselvitys-tarkastamatta (email/load-template "email-templates/valiselvitys-tarkastamatta.fi")
   :muutoshakemuksia-kasittelematta (email/load-template "email-templates/muutoshakemuksia-kasittelematta.fi")
   :laheta-valiselvityspyynnot (email/load-template "email-templates/laheta-valiselvityspyynnot.fi")
   :hakuaika-paattymassa {:fi (email/load-template "email-templates/hakuaika-paattymassa.fi")
                          :sv (email/load-template "email-templates/hakuaika-paattymassa.sv")}
   :hakuaika-paattynyt {:fi (email/load-template "email-templates/hakuaika-paattynyt.fi")}
   :paatokset-lahetetty {:fi (email/load-template "email-templates/paatokset-lahetetty.fi")}
   :valiselvitys-palauttamatta {:fi (email/load-template "email-templates/valiselvitys-palauttamatta.fi")
                                :sv (email/load-template "email-templates/valiselvitys-palauttamatta.sv")}
   :loppuselvitys-palauttamatta {:fi (email/load-template "email-templates/loppuselvitys-palauttamatta.fi")
                                 :sv (email/load-template "email-templates/loppuselvitys-palauttamatta.sv")}})

(defn mail-example [msg-type & [data]]
  {:content (render (:fi (msg-type mail-templates)) (if data data {}))
   :subject (:fi (msg-type mail-titles))
   :sender (-> email/smtp-config :sender)})

(defn start-background-job-send-mails []
  (email/start-background-job-send-mails mail-templates))

(defn stop-background-job-send-mails []
  (email/stop-background-job-send-mails))

(defn send-change-request-message! [lang to avustushaku-id hakemus-id avustushaku-name user-key change-request presenting-officer-email]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url (email/generate-url avustushaku-id lang lang-str user-key false)]
    (log/info "Url would be: " url)
    (email/enqueue-message-to-be-send {:operation :send
                                       :email-type :change-request
                                       :lang lang
                                       :hakemus-id hakemus-id
                                       :from (-> email/smtp-config :from lang)
                                       :bcc presenting-officer-email
                                       :sender (-> email/smtp-config :sender)
                                       :subject (get-in mail-titles [:change-request lang])
                                       :to [to]
                                       :avustushaku avustushaku-name
                                       :url url
                                       :change-request change-request})))

(defn send-taydennyspyynto-message! [lang to avustushaku-id hakemus-id avustushaku-name user-key change-request presenting-officer-email]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url (email/generate-url avustushaku-id lang lang-str user-key false)]
    (log/info "Url would be: " url)
    (email/enqueue-message-to-be-send {:operation :send
                                       :email-type :taydennyspyynto
                                       :lang lang
                                       :hakemus-id hakemus-id
                                       :from (-> email/smtp-config :from lang)
                                       :bcc presenting-officer-email
                                       :sender (-> email/smtp-config :sender)
                                       :subject (get-in mail-titles [:change-request lang])
                                       :to [to]
                                       :avustushaku avustushaku-name
                                       :url url
                                       :yhteyshenkilo presenting-officer-email
                                       :taydennyspyynto change-request})))

(defn paatos-url [avustushaku-id user-key lang]
  (let [va-url (-> config :server :url lang)]
  (str va-url "paatos/avustushaku/" avustushaku-id "/hakemus/" user-key)))

(defn selvitys-url [avustushaku-id user-key lang selvitys-type]
  (let [va-url (-> config :server :url lang)
        lang-str (or (clojure.core/name lang) "fi")]
  (str va-url "avustushaku/" avustushaku-id "/" selvitys-type "?hakemus=" user-key "&lang=" lang-str)))

(defn valiselvitys-url [avustushaku-id user-key lang]
  (selvitys-url avustushaku-id user-key lang "valiselvitys"))

(defn loppuselvitys-url [avustushaku-id user-key lang]
  (selvitys-url avustushaku-id user-key lang "loppuselvitys"))

(defn stream-to-bytearray [is]
  (let [baos (java.io.ByteArrayOutputStream.)]
    (copy is baos)
    (let [bytearray (.toByteArray baos)]
      (log/info bytearray)
      bytearray)))

(defn read-oikaisuvaatimusosoitus-into-byte-array [attachment-id lang]
  (let [oikaisuvaatimus-pdf (resource  (str "public/liitteet/" attachment-id "_" (name lang) ".pdf"))]
    (with-open [in (input-stream oikaisuvaatimus-pdf)]
      (stream-to-bytearray in))))

(defn find-oikaisuvaatimusosoitus-attachments []
(:attachments (first (filter (fn [x] (= (:group x) "Oikaisuvaatimusosoitus")) Liitteet))))

(defn find-3a-oikaisuvaatimusosoitus-attachment []
  (first (filter #(= (:id %1) "3a_oikaisuvaatimusosoitus_valtionavustuslaki") (find-oikaisuvaatimusosoitus-attachments))))

(defn muutoshakemus-paatos-url [user-key lang]
  (let [va-url (-> config :server :url lang)
        lang-str (or (clojure.core/name lang) "fi")]
  (str va-url "muutoshakemus/paatos?user-key=" user-key "&lang=" lang-str)))

(defn send-muutoshakemus-paatos [to avustushaku hakemus arvio roles token muutoshakemus-id paatos]
  (let [lang-str (:language hakemus)
        hakemus-id (:id hakemus)
        lang (keyword lang-str)
        muutoshakemus-paatos-url (muutoshakemus-paatos-url (:user-key paatos) lang)
        muutoshakemus-url (email/modify-url (:id avustushaku) (:user_key hakemus) lang token true)
        mail-subject (get-in mail-titles [:muutoshakemus-paatos lang])
        presenter-role-id (:presenter_role_id arvio)
        oikaisuvaatimusosoitus (find-3a-oikaisuvaatimusosoitus-attachment)
        attachment-title (get (:langs oikaisuvaatimusosoitus) lang)
        attachment-contents (read-oikaisuvaatimusosoitus-into-byte-array (:id oikaisuvaatimusosoitus) lang)
        selected-presenter (first (filter #(= (:id %) presenter-role-id) roles))
        presenter (if (nil? selected-presenter) (first roles) selected-presenter)]
    (email/try-send-msg-once {
                          :email-type :muutoshakemus-paatos
                          :lang lang
                          :muutoshakemus-id muutoshakemus-id
                          :from (-> email/smtp-config :from lang)
                          :sender (-> email/smtp-config :sender)
                          :subject mail-subject
                          :presenter-name (:name presenter)
                          :to to
                          :hakemus-id hakemus-id
                          :paatos-url muutoshakemus-paatos-url
                          :muutoshakemus-url muutoshakemus-url
                          :register-number (:register_number hakemus)
                          :project-name (:project_name hakemus)
                          :attachment-title attachment-title
                          :attachment {:title attachment-title
                                       :description attachment-title
                                       :contents attachment-contents}}

                           (partial render (get-in mail-templates [:muutoshakemus-paatos lang])))))

(defn- generate-avustushaku-url [avustushaku-id]
  (str (-> config :server :virkailija-url)
       "/avustushaku/" avustushaku-id "/"))

(defn- to-selvitys-tarkastamatta [selvitys]
  {:link (generate-avustushaku-url (:avustushaku selvitys))
   :count (:hakemus-count selvitys)})

(defn- to-loppuselvitys-tarkastamatta [selvitys]
  {:link (generate-avustushaku-url (:avustushaku-id selvitys))
   :count (:hakemus-count selvitys)
   :avustushaku-id (:avustushaku-id selvitys)})

(defn sum [values] (reduce + 0 values))

(defn send-loppuselvitys-taloustarkastamatta [loppuselvitys-list]
  (let [lang     :fi
        template (:loppuselvitys-taloustarkastamatta mail-templates)
        list     (seq (map to-loppuselvitys-tarkastamatta loppuselvitys-list))
        avustushaku-id (:avustushaku-id (last list))
        total-hakemus-count (sum (map :count list))]
    (email/try-send-msg-once {:email-type :loppuselvitys-taloustarkastamatta
                              :lang lang
                              :from (-> email/smtp-config :from lang)
                              :avustushaku-id avustushaku-id
                              :sender (-> email/smtp-config :sender)
                              :to (-> email/smtp-config :to-taloustarkastaja)
                              :subject "Taloustarkastamattomia loppuselvityksiä"
                              :total-hakemus-count total-hakemus-count
                              :list list}
                             (partial render template))))

(defn send-hakuaika-paattymassa [hakemus]
  (let [lang-str       (:language hakemus)
        lang           (keyword lang-str)
        mail-subject   (get-in mail-titles [:hakuaika-paattymassa lang])
        template       (get-in mail-templates [:hakuaika-paattymassa lang])
        to             (:contact-email hakemus)
        paattymispaiva (datetime/date-string (datetime/parse (:paattymispaiva hakemus)))
        paattymisaika  (datetime/time-string (datetime/parse (:paattymispaiva hakemus)))

        url            (email/generate-url (:avustushaku-id hakemus) lang lang-str (:user-key hakemus) false) ]
    (log/info "sending to" to)
    (email/try-send-msg-once {:email-type :hakuaika-paattymassa
                              :lang lang
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :to [to]
                              :subject mail-subject
                              :paattymispaiva paattymispaiva
                              :paattymisaika paattymisaika
                              :avustushaku-name (:avustushaku-name hakemus)
                              :avustushaku-id (:avustushaku-id hakemus)
                              :url url}
                             (partial render template))))

(defn send-hakuaika-paattynyt [notification]
  (let [lang         :fi
        mail-subject (get-in mail-titles [:hakuaika-paattynyt lang])
        template     (get-in mail-templates [:hakuaika-paattynyt lang])]
    (email/try-send-msg-once {:email-type :hakuaika-paattynyt
                              :lang lang
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :subject mail-subject
                              :to (:to notification)
                              :avustushaku-id (:avustushaku-id notification)
                              :avustushaku-name (:avustushaku-name notification)
                              :hakemus-count (:hakemus-count notification)
                              :haettu-total-eur (:haettu-total-eur notification)}
                             (partial render template))))

(defn send-loppuselvitys-asiatarkastamatta [to loppuselvitys-list]
  (let [lang     :fi
        template (:loppuselvitys-asiatarkastamatta mail-templates)
        list     (seq (map to-loppuselvitys-tarkastamatta loppuselvitys-list))
        avustushaku-id (:avustushaku-id (last list))
        total-hakemus-count (sum (map :count list))]
    (email/try-send-msg-once {:email-type :loppuselvitys-asiatarkastamatta
                              :lang lang
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :avustushaku-id avustushaku-id
                              :to to
                              :subject "Asiatarkastamattomia loppuselvityksiä"
                              :total-hakemus-count total-hakemus-count
                              :list list}
                             (partial render template))))

(defn send-valiselvitys-tarkastamatta [to valiselvitys-list]
  (let [lang     (keyword "fi")
        template (:valiselvitys-tarkastamatta mail-templates)
        list     (seq (map to-selvitys-tarkastamatta valiselvitys-list))
        total-hakemus-count (sum (map :count list))]
    (email/try-send-msg-once {:email-type :valiselvitys-tarkastamatta
                              :lang lang
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :to to
                              :subject "Tarkastamattomia väliselvityksiä"
                              :total-hakemus-count total-hakemus-count
                              :list list}
                             (partial render template))))

(defn- to-muutoshakemus-kasittelematta [notification]
  {:link (generate-avustushaku-url (:avustushaku-id notification))
   :count (:count notification)})

(defn send-muutoshakemuksia-kasittelematta [notification]
  (let [lang     (keyword "fi")
        template (:muutoshakemuksia-kasittelematta mail-templates)
        to       (:to notification)
        avustushaku-id (:avustushaku-id notification)
        list     (seq (map to-muutoshakemus-kasittelematta (:list notification)))
        total-muutoshakemus-count (sum (map :count list))]
    (email/try-send-msg-once {:email-type :muutoshakemuksia-kasittelematta
                              :lang lang
                              :avustushaku-id avustushaku-id
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :to [to]
                              :subject "Käsittelemättömiä muutoshakemuksia"
                              :total-muutoshakemus-count total-muutoshakemus-count
                              :list list}
                             (partial render template))))

(defn send-valiselvitys-palauttamatta [notification]
  (let [lang         (keyword (:language notification))
        mail-subject (get-in mail-titles [:valiselvitys-palauttamatta lang])
        template     (get-in mail-templates [:valiselvitys-palauttamatta lang])]
    (email/try-send-msg-once {:email-type :valiselvitys-palauttamatta
                              :hakemus-id (:hakemus-id notification)
                              :lang lang
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :to [(:contact-email notification)]
                              :subject mail-subject
                              :avustushaku-name (:avustushaku-name notification)
                              :valiselvitys-deadline (datetime/java8-date-string (:valiselvitys-deadline notification))
                              :url (valiselvitys-url (:avustushaku-id notification) (:user-key notification) lang)}
                             (partial render template))))

(defn send-laheta-valiselvityspyynnot [notification]
  (let [lang         :fi
        template     (:laheta-valiselvityspyynnot mail-templates)]
    (email/try-send-msg-once {:email-type :laheta-valiselvityspyynnot
                              :avustushaku-name (:avustushaku-name notification)
                              :lang lang
                              :avustushaku-id (:avustushaku-id notification)
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :to (:to notification)
                              :subject "Muistutus väliselvityspyyntöjen lähettämisestä"
                              :valiselvitys-deadline (datetime/java8-date-string (:deadline notification))}
                             (partial render template))))

(defn send-laheta-loppuselvityspyynnot [notification]
  (let [lang         :fi
        template     (:laheta-loppuselvityspyynnot mail-templates)]
    (email/try-send-msg-once {:email-type :laheta-loppuselvityspyynnot
                              :avustushaku-name (:avustushaku-name notification)
                              :lang lang
                              :avustushaku-id (:avustushaku-id notification)
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :to (:to notification)
                              :subject "Muistutus loppuselvityspyyntöjen lähettämisestä"
                              :loppuselvitys-deadline (datetime/java8-date-string (:deadline notification))}
                             (partial render template))))

(defn send-loppuselvitys-palauttamatta [notification]
  (let [lang           (keyword (:language notification))
        mail-subject   (get-in mail-titles [:loppuselvitys-palauttamatta lang])
        template       (get-in mail-templates [:loppuselvitys-palauttamatta lang])]
    (email/try-send-msg-once {:email-type :loppuselvitys-palauttamatta
                              :hakemus-id (:hakemus-id notification)
                              :lang lang
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :to [(:contact-email notification)]
                              :subject mail-subject
                              :avustushaku-name (:avustushaku-name notification)
                              :loppuselvitys-deadline (datetime/java8-date-string (:loppuselvitys-deadline notification))
                              :url (loppuselvitys-url (:avustushaku-id notification) (:user-key notification) lang)}
                             (partial render template))))

(defn send-paatos! [to avustushaku hakemus]
  (let [lang-str (:language hakemus)
        lang (keyword lang-str)
        url (paatos-url (:id avustushaku) (:user_key hakemus) (keyword lang-str))
        avustushaku-name (get-in avustushaku [:content :name (keyword lang-str)])
        mail-subject (get-in mail-titles [:paatos lang])]
    (log/info "Url would be: " url)
    (email/try-send-msg-once {
                          :email-type :paatos
                          :lang lang
                          :from (-> email/smtp-config :from lang)
                          :sender (-> email/smtp-config :sender)
                          :subject mail-subject
                          :avustushaku-name avustushaku-name
                          :to to
                          :url url
                          :register-number (:register_number hakemus)
                          :project-name (:project_name hakemus)}

                           (partial render (get-in mail-templates [:paatos lang])))))

(defn send-paatokset-lahetetty [yhteenveto-url avustushaku-id avustushaku-name to]
  (let [lang (keyword "fi")]
  (email/try-send-msg-once {
                            :email-type :paatokset-lahetetty
                            :from (-> email/smtp-config :from lang)
                            :sender (-> email/smtp-config :sender)
                            :to to
                            :subject "Avustuspäätökset on lähetetty"
                            :lang lang
                            :avustushaku-name avustushaku-name
                            :yhteenveto-url yhteenveto-url
                            :avustushaku-id avustushaku-id
                            }
                           (partial render (get-in mail-templates [:paatokset-lahetetty lang])))))

(defn- has-multiple-menoluokka-rows [hakemus-id]
  (let [result (first (query "SELECT COUNT(id) FROM menoluokka_hakemus WHERE hakemus_id = ?" [hakemus-id]))]
    (> (:count result) 1)))

(defn- has-normalized-hakemus [hakemus-id]
  (let [result (first (query "SELECT COUNT(id) FROM normalized_hakemus WHERE hakemus_id = ?" [hakemus-id]))]
    (> (:count result) 0)))

(defn should-include-muutoshaku-link-in-paatos-email? [avustushaku hakemus-id]
  (and
    (:muutoshakukelpoinen avustushaku)
    (has-normalized-hakemus hakemus-id)))

(defn send-paatos-refuse! [to avustushaku hakemus token]
  (let [lang-str (:language hakemus)
        lang (keyword lang-str)
        url (paatos-url (:id avustushaku) (:user_key hakemus) (keyword lang-str))
        paatos-refuse-url (email/refuse-url (:id avustushaku) (:user_key hakemus) lang token)
        budjettimuutoshakemus-enabled? (has-multiple-menoluokka-rows (:id hakemus))
        include-muutoshaku-link? (should-include-muutoshaku-link-in-paatos-email? avustushaku (:id hakemus))
        paatos-modify-url (email/modify-url (:id avustushaku) (:user_key hakemus) lang token include-muutoshaku-link?)
        avustushaku-name (get-in avustushaku [:content :name (keyword lang-str)])
        mail-subject (get-in mail-titles [:paatos lang])
        msg {
             :email-type :paatos-refuse
             :lang lang
             :from (-> email/smtp-config :from lang)
             :sender (-> email/smtp-config :sender)
             :subject mail-subject
             :avustushaku-name avustushaku-name
             :to to
             :hakemus-id (:id hakemus)
             :url url
             :refuse-url paatos-refuse-url
             :modify-url paatos-modify-url
             :register-number (:register_number hakemus)
             :project-name (:project_name hakemus)
             :budjettimuutoshakemus-enabled budjettimuutoshakemus-enabled?
             :include-muutoshaku-link include-muutoshaku-link?}
        format-plaintext-message (partial render (get-in mail-templates [:paatos-refuse lang]))
        ]
    (log/info "Sending decision email with refuse link")
    (log/info "Urls would be: " url "\n" paatos-refuse-url)
    (email/try-send-msg-once msg format-plaintext-message)
    ))

(defn send-selvitys! [to hakemus mail-subject mail-message]
  (let [lang (keyword (:language hakemus))]
    (email/enqueue-message-to-be-send {:operation :send
                                       :email-type :selvitys
                                       :lang lang
                                       :from (-> email/smtp-config :from lang)
                                       :sender (-> email/smtp-config :sender)
                                       :subject mail-subject
                                       :to to
                                       :body mail-message})))

(defn send-selvitys-notification! [to avustushaku hakemus selvitys-type arvio roles uuid identity]
  (let [lang-str (:language hakemus)
        lang (keyword lang-str)
        type (str selvitys-type "-notification")
        presenter-role-id (:presenter_role_id arvio)
        url (selvitys-url (:id avustushaku) (:user_key hakemus) lang selvitys-type)
        avustushaku-name (get-in avustushaku [:content :name lang])
        mail-subject (str (get-in mail-titles [(keyword type) lang]) " " avustushaku-name)
        selected-presenter (first (filter #(= (:id %) presenter-role-id) roles))
        presenter (if (nil? selected-presenter) (first roles) selected-presenter)
        disable-selvitysmail-to-virkailija (-> config :dont-send-loppuselvityspyynto-to-virkailija :enabled?)
        selvitysdate-unformatted ((keyword (str selvitys-type "date")) avustushaku)
        selvitysdate (if (nil? selvitysdate-unformatted) "" (datetime/java8-date-string selvitysdate-unformatted))]
    (log/info "Url would be: " url)
    (tapahtumaloki/create-log-entry type (:id avustushaku) (:id hakemus) identity uuid to true)
    (email/enqueue-message-to-be-send {:operation :send
                                       :hakemus-id (:id hakemus)
                                       :avustushaku-id (:id avustushaku)
                                       :email-type (keyword type)
                                       :lang lang
                                       :from (-> email/smtp-config :from lang)
                                       :sender (-> email/smtp-config :sender)
                                       :subject mail-subject
                                       :selvitysdate selvitysdate
                                       :presenter-name (:name presenter)
                                       :avustushaku-name avustushaku-name
                                       :to to
                                       :bcc (when-not disable-selvitysmail-to-virkailija (:email identity))
                                       :url url
                                       :register-number (:register_number hakemus)
                                       :project-name (:project_name hakemus)})))

(defn send-payments-info! [payments-info]
  (let [lang :fi
        grant-title (get-in payments-info [:title lang])
        mail-subject
        (format (get-in mail-titles [:payments-info-notification lang])
                grant-title)]
    (email/enqueue-message-to-be-send {:operation :send
                                       :email-type :payments-info-notification
                                       :lang lang
                                       :from (-> email/smtp-config :from lang)
                                       :sender (-> email/smtp-config :sender)
                                       :subject mail-subject
                                       :to (:receivers payments-info)
                                       :date (:date payments-info)
                                       :batch-key (:batch-key payments-info)
                                       :count (:count payments-info)
                                       :total-granted (:total-granted payments-info)})))

(defjob EmailRetryJob [ctx]
  (log/info "Running email retry")
  (email/retry-sending-failed-emails))

(defn start-persistent-retry-job []
  (qs/schedule
    (qs/start (qs/initialize))
    (j/build
      (j/of-type EmailRetryJob)
      (j/with-identity (j/key (str "jobs." "EmailRetry"))))
    (t/build
      (t/with-identity (t/key (str "triggers." "EmailRetry")))
      (t/start-now)
      (t/with-schedule (schedule
                        (cron-schedule
                         (get-in config [:email :persistent-retry :schedule])))))))

(defn stop-persistent-retry-job []
  (qs/delete-trigger (qs/start (qs/initialize)) (t/key (str "triggers." "EmailRetry"))))
