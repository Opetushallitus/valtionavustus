(ns oph.common.email-utils
  (:require [ring.util.codec :refer [form-encode]]
            [oph.soresu.common.config :refer [config]]))

(defn url-generator [va-url avustushaku-id user-key lang token type]
  (let [lang-str (or (clojure.core/name lang) "fi")
        refuse (= type "refuse") 
        modify (= type "modify")
        preview (= type "refuse")
        url-parameters  (form-encode {:avustushaku avustushaku-id :hakemus user-key :lang lang-str :preview preview :token token :refuse-grant refuse :modify-application modify})]
(str va-url "avustushaku/" avustushaku-id "/nayta?" url-parameters)))

(defn muutoshaku-url-generator [va-url avustushaku-id user-key lang]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url-parameters  (form-encode { :lang lang-str :user-key user-key :avustushaku-id avustushaku-id})]
(str va-url "muutoshaku?" url-parameters)))

 (defn modify-url [va-url avustushaku-id user-key lang token]
   (if (config :muutospaatosprosessi-enabled)
     (muutoshaku-url-generator va-url avustushaku-id user-key lang)
     (url-generator va-url avustushaku-id user-key lang token "modify")))
  
  (defn refuse-url [va-url avustushaku-id user-key lang token]
    (url-generator va-url avustushaku-id user-key lang token "refuse"))
